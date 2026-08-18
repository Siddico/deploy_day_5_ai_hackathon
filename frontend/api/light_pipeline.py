import os
import json
import logging
import numpy as np
import re
import cohere
from pathlib import Path
from typing import List, Dict
from rank_bm25 import BM25Okapi

logger = logging.getLogger("MedicalRAG-Light")
logger.setLevel(logging.INFO)

class BM25Retriever:
    def __init__(self, chunks: List[Dict]):
        self.chunks = chunks
        self.bm25 = BM25Okapi([self.tokenize(c["text"]) for c in chunks])

    @staticmethod
    def tokenize(text: str):
        words = re.findall(r"\b[a-zA-Z0-9]+(?:[-'][a-zA-Z0-9]+)*\b", text.lower())
        stopwords = {"what", "is", "the", "how", "do", "are", "in", "and", "of", "to", "a", "for", "with", "on", "as", "by", "that", "it", "this", "be", "from", "at", "an", "was", "which", "or", "can", "does"}
        return [w for w in words if w not in stopwords]

    def retrieve(self, query: str, top_k: int = 20) -> Dict[str, float]:
        scores = self.bm25.get_scores(self.tokenize(query))
        max_score = max(scores) if len(scores) > 0 and max(scores) > 0 else 1.0
        top_idx = np.argsort(scores)[::-1][:top_k]
        return {self.chunks[i]["chunk_id"]: float(scores[i] / max_score) for i in top_idx if scores[i] > 0}

class CohereEmbedderRetriever:
    def __init__(self, api_key: str, chunks_file: str, embeddings_file: str):
        self.co = cohere.Client(api_key)
        
        with open(chunks_file, "r", encoding="utf-8") as f:
            self.chunks = json.load(f)
            
        self.embeddings = np.load(embeddings_file)
        self.bm25 = BM25Retriever(self.chunks)
        
        # Norms for cosine similarity
        self.norms = np.linalg.norm(self.embeddings, axis=1)

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict]:
        # Embed query
        res = self.co.embed(texts=[query], model="embed-english-v3.0", input_type="search_query")
        q_emb = np.array(res.embeddings[0])
        
        # Dense Cosine Similarity
        q_norm = np.linalg.norm(q_emb)
        dot_products = np.dot(self.embeddings, q_emb)
        similarities = dot_products / (self.norms * q_norm)
        
        dense_scores = {self.chunks[i]["chunk_id"]: float(similarities[i]) for i in range(len(self.chunks))}
        bm25_scores = self.bm25.retrieve(query, 20)
        
        fused = []
        for i, chunk in enumerate(self.chunks):
            cid = chunk["chunk_id"]
            d_score = dense_scores.get(cid, 0.0)
            b_score = bm25_scores.get(cid, 0.0)
            hybrid = (0.65 * d_score) + (0.35 * b_score)
            
            if chunk.get("is_reference", False):
                hybrid *= 0.20
                
            if hybrid > 0.1: # Threshold filter
                fused.append({
                    "chunk_id": cid, "score": hybrid, "dense": d_score, "bm25": b_score,
                    "text": chunk["text"], "metadata": chunk
                })
                
        fused.sort(key=lambda x: x["score"], reverse=True)
        return fused[:top_k]

class CohereGenerator:
    def __init__(self, api_key: str, model_name="command-r-plus-08-2024"):
        self.client = cohere.Client(api_key)
        self.model_name = model_name

    def generate(self, query: str, retrieved_chunks: List[Dict]) -> str:
        context = ""
        for i, chunk in enumerate(retrieved_chunks):
            doc_name = chunk['metadata'].get('document', f'Source {i+1}')
            sec = chunk['metadata'].get('section_path', chunk['metadata'].get('section', ''))
            sec_display = sec if sec and sec.lower() != 'general' else 'General Content'
            context += f"--- Document: {doc_name} (Section: {sec_display}) ---\n"
            context += f"{chunk['text']}\n\n"

        system_prompt = f"""You are an AI Clinical Decision Support Assistant.
Your primary directive is patient safety and strict adherence to the provided clinical guidelines.

### INSTRUCTIONS:
1. Carefully read the provided context.
2. If the context contains the answer to the user's question, answer it accurately and comprehensively based ONLY on the context.
3. Do NOT refuse to answer if the information is clearly present in the text (e.g. global mortality statistics).

### REFUSAL RULES & RUBRIC (MANDATORY ONLY WHEN REFUSING):
If the user asks about something NOT in the text, requests personal medical advice, or is off-topic, you MUST refuse by strictly following this 3-point checklist:
1. **States insufficiency**: Clearly state that the available evidence doesn't support an answer. No vague hedging, no partial guesses.
2. **Stays honest**: You MUST set `confidence` to "None" and `citations` to an empty array `[]`.
3. **Offers a next step**: Suggest something concrete to the user (e.g. rephrasing the question, consulting a clinician, or checking a different source).

### PROVIDED CONTEXT:
{context}
"""
        json_prompt = """
Respond with a JSON object strictly adhering to the following schema:
{
  "recommendation": "The main recommendation. If refusing, state the insufficiency and offer a concrete next step (e.g. consult a clinician).",
  "evidence": "Excerpt of evidence supporting the recommendation. Leave empty if refusing.",
  "citations": [
    {
      "document": "The exact file name that comes after 'Document:' in the context separator (e.g. MCO2-7-e70869.pdf). DO NOT write 'Source 1'.",
      "section": "The exact Section name provided in the context.",
      "page": "Not available, output 'N/A'"
    }
  ],
  "confidence": "high, medium, low, or None (if refusing)"
}
"""
        try:
            response = self.client.chat(
                message=query + "\n\n" + json_prompt,
                preamble=system_prompt,
                model=self.model_name,
                temperature=0.1
            )
            return response.text
        except Exception as e:
            return json.dumps({"error": str(e)})
