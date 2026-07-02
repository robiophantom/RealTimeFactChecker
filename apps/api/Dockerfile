FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir .

# Copy application code
COPY ./app ./app
COPY run_worker.py /app/run_worker.py
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose port for FastAPI
EXPOSE 8000

# Default command runs both the API server and the dramatiq worker
CMD ["/app/start.sh"]
