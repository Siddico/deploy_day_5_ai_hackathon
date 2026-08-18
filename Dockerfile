# Use official Python runtime as base image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY backend/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend directory
COPY backend/ ./backend/

# Copy the pdf and the medical_rag folder (which contains ChromaDB cache)
# This assumes we are running Docker build from the project root.
COPY MCO2-7-e70869.pdf .
COPY medical_rag/ ./medical_rag/

# Add backend directory to python path
ENV PYTHONPATH=/app/backend

# Expose port 7860 (Hugging Face default)
EXPOSE 7860

# Run the FastAPI application on port 7860
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
