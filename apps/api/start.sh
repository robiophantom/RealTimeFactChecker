#!/bin/bash
# Start dramatiq worker in the background
dramatiq app.workers.tasks &

# Start uvicorn API server in the foreground
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
