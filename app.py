import uvicorn
import os
import sys

# Ensure backend directory is in the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.main import app

if __name__ == "__main__":
    # Hugging Face Gradio spaces expose port 7860
    uvicorn.run(app, host="0.0.0.0", port=7860)
