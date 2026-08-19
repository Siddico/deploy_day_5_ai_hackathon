import os
import sys

# Ensure backend directory is in the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.main import app as fastapi_app
import gradio as gr

# Create a simple Gradio UI to satisfy Hugging Face Spaces
def greet():
    return "The Probably RAG API is running. The endpoints are available at /api/query and /api/status."

demo = gr.Interface(fn=greet, inputs=[], outputs="text")

# Mount FastAPI onto Gradio
app = gr.mount_gradio_app(fastapi_app, demo, path="/gradio")

# If run locally or by HF SDK directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
