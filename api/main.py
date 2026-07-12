"""FastAPI backend for the Agentic FAQ Support Pipeline.

Wraps the existing RAG logic (``langchain_helper``) and SQLite ticketing
(``db_helper``) in REST endpoints so a separate frontend (e.g. a React app)
can replace the Streamlit UI.

Run locally from the repo root:

    uvicorn api.main:app --reload

Interactive docs are then served at http://localhost:8000/docs
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import db_helper
from api.routers import ask, tickets

# React dev servers (Vite / Create React App) allowed during development.
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
]


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Ensure the tickets table exists before serving requests."""
    db_helper.init_db()
    yield


app = FastAPI(
    title="Agentic FAQ Support Pipeline API",
    version="0.1.0",
    description="REST backend wrapping the NVIDIA NIM RAG chain and ticketing system.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health() -> dict:
    """Lightweight liveness probe."""
    return {"status": "ok"}


app.include_router(ask.router)
app.include_router(tickets.router)
