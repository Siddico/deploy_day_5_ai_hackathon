import os
import json
import traceback
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from .light_pipeline import CohereEmbedderRetriever, CohereGenerator

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize globally for serverless cold starts
cohere_key = os.environ.get("COHERE_API_KEY")

retriever = None
generator = None

try:
    if cohere_key:
        chunks_file = os.path.join(os.path.dirname(__file__), "data", "chunks.json")
        embeddings_file = os.path.join(os.path.dirname(__file__), "data", "embeddings.npy")
        retriever = CohereEmbedderRetriever(api_key=cohere_key, chunks_file=chunks_file, embeddings_file=embeddings_file)
        generator = CohereGenerator(api_key=cohere_key)
except Exception as e:
    print(f"Error initializing pipeline: {e}")
    traceback.print_exc()

class QueryRequest(BaseModel):
    query: str

@app.get("/api/status")
def get_status():
    return {
        "pipeline_ready": retriever is not None,
        "retriever_connected": retriever is not None,
        "has_keys": bool(cohere_key)
    }

@app.post("/api/query")
def run_query(request: QueryRequest):
    if not retriever or not generator:
        raise HTTPException(status_code=503, detail="Pipeline not ready. Check server logs or API keys.")
        
    query = request.query
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
        
    try:
        chunks = retriever.retrieve(query, top_k=5)
        response_text = generator.generate(query, chunks)
        
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
                "confidence": "Unknown"
            }
            
        return {
            "structured_output": structured_data,
            "retrieved_chunks": chunks,
            "raw_json": clean_text
        }
        
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
