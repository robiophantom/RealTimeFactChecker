# Real-Time Fact Checker - API Backend

This is the backend for the Real-Time Fact Checker. It exposes the REST API using FastAPI and processes asynchronous background tasks (like transcription and fact-checking) using Dramatiq.

## Tech Stack
- **Web Framework:** FastAPI (Python)
- **Task Queue:** Dramatiq
- **Message Broker:** Redis
- **Database Client:** Supabase (PostgreSQL)

## Getting Started

The easiest way to run the backend is via Docker Compose from the root of the project.
However, if you want to run it natively for local development or debugging:

### Prerequisites
- Python 3.11+
- A running Redis instance

### Installation

Navigate to this directory and install the project dependencies:

```bash
pip install -e .
```

### Environment Variables

Make sure you have an `.env` file created in `apps/api`. It should contain your Supabase keys, Groq and Tavily API keys, and your Redis URL. (See the root project `README.md` for the complete list of variables).

### Running Locally (Without Docker)

You must run the web server and the background worker as two separate processes.

**1. Start the API Server:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**2. Start the Background Worker:**
```bash
dramatiq app.workers.tasks
```

## Deployment

When deploying to production, you will need to host two separate instances (e.g., on Render, Railway, or AWS ECS):
1. **The Web API**: Start using `uvicorn app.main:app --host 0.0.0.0 --port 8000`
2. **The Background Worker**: Start using `dramatiq app.workers.tasks`

Ensure both instances are configured with the same environment variables and connect to the same managed Redis instance.
