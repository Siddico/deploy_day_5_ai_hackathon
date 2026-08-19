import os
import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from dotenv import load_dotenv

from rag_pipeline import SentenceTransformerEmbedder, MedicalRAGPipeline, CohereGenerator, HybridRetriever
import chromadb
from rank_bm25 import BM25Okapi
import traceback

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("MedicalRAGAPI")

# Paths (adjust as needed, moving up one dir since we are in backend/)
BASE_DIR = Path(__file__).parent.parent
PDF_PATH = BASE_DIR / "MCO2-7-e70869.pdf"
WORK_DIR = BASE_DIR / "medical_rag"
CHROMA_DIR = WORK_DIR / "chromadb_cohere"
OUTPUTS_DIR = WORK_DIR / "outputs"

pipeline = None
generator = None
pipeline_ready = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    global pipeline, generator, pipeline_ready
    logger.info("Starting up API, initializing RAG pipeline...")
    
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    
    llama_key = os.environ.get("LLAMA_CLOUD_API_KEY")
    cohere_key = os.environ.get("COHERE_API_KEY")
    
    if not llama_key or not cohere_key:
        logger.warning("Missing API keys. Please set LLAMA_CLOUD_API_KEY and COHERE_API_KEY in backend/.env")
        yield
        return
        
    try:
        embedder = SentenceTransformerEmbedder(model_name="BAAI/bge-base-en-v1.5")
        pipeline = MedicalRAGPipeline(api_key=llama_key, pdf_path=PDF_PATH, embedder=embedder, outputs_dir=OUTPUTS_DIR, chroma_dir=CHROMA_DIR)
        generator = CohereGenerator(api_key=cohere_key, model_name="command-r-plus-08-2024")
        
        chunks_cache = OUTPUTS_DIR / "04_chunks_clean.json"
        
        if not chunks_cache.exists():
            logger.info("Cache not found. Building index...")
            pipeline.build_index()
        else:
            logger.info("Cache found. Loading pipeline...")
            with open(chunks_cache, "r", encoding="utf-8") as f:
                loaded_chunks = json.load(f)
            client = chromadb.PersistentClient(path=str(CHROMA_DIR))
            col = client.get_collection(name="rag_index")
            
            # Simple BM25 setup wrapper for loaded_chunks
            class TempBM25Retriever:
                def __init__(self, chunks):
                    self.chunks = chunks
                    self.bm25 = BM25Okapi([self.tokenize(c["text"]) for c in chunks])
                def tokenize(self, text: str):
                    import re
                    words = re.findall(r"\b[a-zA-Z0-9]+(?:[-'][a-zA-Z0-9]+)*\b", text.lower())
                    stopwords = {"what", "is", "the", "how", "do", "are", "in", "and", "of", "to", "a", "for", "with", "on", "as", "by", "that", "it", "this", "be", "from", "at", "an", "was", "which", "or", "can", "does"}
                    return [w for w in words if w not in stopwords]
                def retrieve(self, query: str, top_k: int = 20):
                    import numpy as np
                    scores = self.bm25.get_scores(self.tokenize(query))
                    max_score = max(scores) if len(scores) > 0 and max(scores) > 0 else 1.0
                    top_idx = np.argsort(scores)[::-1][:top_k]
                    return {self.chunks[i]["chunk_id"]: float(scores[i] / max_score) for i in top_idx if scores[i] > 0}
                    
            bm25 = TempBM25Retriever(loaded_chunks)
            pipeline.retriever = HybridRetriever(col, embedder, bm25, loaded_chunks)
            
        pipeline_ready = True
        logger.info("RAG Pipeline is Ready.")
    except Exception as e:
        logger.error(f"Error initializing pipeline: {e}")
        traceback.print_exc()
        
    yield
    logger.info("Shutting down API...")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

@app.get("/api/status")
def get_status():
    return {
        "pipeline_ready": pipeline_ready,
        "retriever_connected": pipeline.retriever is not None if pipeline else False,
        "has_keys": bool(os.environ.get("LLAMA_CLOUD_API_KEY") and os.environ.get("COHERE_API_KEY"))
    }

@app.post("/api/query")
def run_query(request: QueryRequest):
    if not pipeline_ready or not pipeline.retriever or not generator:
        raise HTTPException(status_code=503, detail="Pipeline not ready. Check server logs.")
        
    query = request.query
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
        
    try:
        chunks = pipeline.retriever.retrieve(query, top_k=5)
        # Parse the Cohere output as JSON, since we asked it to be JSON
        response_text = generator.generate(query, chunks)
        
        # Sometimes Cohere wraps json in ```json ... ```
        clean_text = response_text
        if "```json" in clean_text:
            clean_text = clean_text.split("```json")[1].split("```")[0]
        elif "```" in clean_text:
            clean_text = clean_text.split("```")[1].split("```")[0]
            
        clean_text = clean_text.strip()
        
        try:
            structured_data = json.loads(clean_text)
        except json.JSONDecodeError:
            structured_data = {
                "recommendation": clean_text,
                "evidence": "",
                "citations": [],
                "confidence": "Unknown (Failed to parse JSON)",
                "safety_analysis": {
                    "reasoning": "Failed to parse JSON from LLM.",
                    "confidence_score": 0.0,
                    "citation_accuracy": 0.0,
                    "faithfulness": 0.0
                }
            }
            
        return {
            "structured_output": structured_data,
            "retrieved_chunks": chunks,
            "raw_json": clean_text
        }
        
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
