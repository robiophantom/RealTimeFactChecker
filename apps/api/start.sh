#!/bin/bash
# Start custom dramatiq worker in the background
python run_worker.py &

# Start uvicorn API server in the foreground
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
