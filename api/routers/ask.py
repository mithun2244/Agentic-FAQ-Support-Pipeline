"""/ask endpoint: resolved-ticket lookup first, then the NVIDIA NIM RAG chain."""
from fastapi import APIRouter, Depends, HTTPException

import db_helper
from api.deps import get_chain
from api.schemas import AskRequest, AskResponse

router = APIRouter(tags=["ask"])


def _is_dont_know(text: str) -> bool:
    """Return True if the model's answer signals it could not answer."""
    lowered = text.lower()
    return "i don't know" in lowered or "i dont know" in lowered


@router.post("/ask", response_model=AskResponse)
def ask(payload: AskRequest, chain=Depends(get_chain)) -> AskResponse:
    """Answer a question.

    1. Check the resolved-ticket store first (no LLM call).
    2. Otherwise run the RAG chain; ``resolved`` is False when the model
       couldn't answer, signalling the frontend to offer the ticket fallback.
    """
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question must not be empty.")

    prior = db_helper.find_answered(question)
    if prior:
        return AskResponse(question=question, answer=prior, source="ticket", resolved=True)

    result = chain.invoke(question)
    answer = result["result"]
    return AskResponse(
        question=question,
        answer=answer,
        source="rag",
        resolved=not _is_dont_know(answer),
    )
