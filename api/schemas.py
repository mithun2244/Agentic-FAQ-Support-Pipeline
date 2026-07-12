"""Pydantic request/response models for the FastAPI backend."""
from typing import Literal, Optional

from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    """A user question sent to the assistant."""

    question: str = Field(..., min_length=1, description="The user's question.")


class AskResponse(BaseModel):
    """The assistant's answer plus provenance for the frontend to act on."""

    question: str
    answer: str
    source: Literal["ticket", "rag"] = Field(
        ..., description="'ticket' if resolved from a prior answered ticket, else 'rag'."
    )
    resolved: bool = Field(
        ...,
        description="True if a confident answer was produced; False means the model "
        "could not answer and the frontend should offer the ticket fallback.",
    )


class TicketCreateRequest(BaseModel):
    """Escalate an unanswered question to a human support ticket."""

    question: str = Field(..., min_length=1)
    contact: Optional[str] = Field(None, description="Optional email or Discord tag.")


class TicketCreateResponse(BaseModel):
    """Result of creating a ticket."""

    id: int
    status: str


class Ticket(BaseModel):
    """A support ticket record."""

    id: int
    question: str
    answer: Optional[str] = None
    status: str
    contact: Optional[str] = None
    created_at: Optional[str] = None


class AnswerRequest(BaseModel):
    """An admin's answer to a pending ticket."""

    ticket_id: int
    answer: str = Field(..., min_length=1)


class AnswerResponse(BaseModel):
    """Result of answering a ticket."""

    id: int
    status: str
