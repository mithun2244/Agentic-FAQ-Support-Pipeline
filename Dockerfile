# Production image for the Agentic FAQ Support Pipeline API (FastAPI + NVIDIA NIM RAG).
FROM python:3.12-slim

# Cleaner, faster Python in containers.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install dependencies first so this layer is cached until requirements change.
COPY requirements.txt requirements-api.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements-api.txt

# Copy only what the API needs (see .dockerignore for what's excluded).
COPY api/ ./api/
COPY langchain_helper.py db_helper.py ./
COPY faiss_index/ ./faiss_index/
COPY codebasics_faqs.csv ./

# Run as a non-root user; /data is a writable mount point for the SQLite store.
RUN useradd --create-home --uid 1000 appuser \
    && mkdir -p /data \
    && chown -R appuser:appuser /app /data
USER appuser

EXPOSE 8000

# Container-level liveness probe against the API's /health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/health').status==200 else 1)"

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
