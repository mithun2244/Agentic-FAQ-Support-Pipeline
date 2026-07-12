"""/tickets endpoints: create, list pending, and answer support tickets."""
from typing import List

from fastapi import APIRouter, HTTPException

import db_helper
from api.schemas import (
    AnswerRequest,
    AnswerResponse,
    Ticket,
    TicketCreateRequest,
    TicketCreateResponse,
)

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.post("", response_model=TicketCreateResponse, status_code=201)
def create_ticket(payload: TicketCreateRequest) -> TicketCreateResponse:
    """Escalate an unanswered question to a new Pending ticket."""
    ticket_id = db_helper.create_ticket(payload.question, payload.contact)
    return TicketCreateResponse(id=ticket_id, status="Pending")


@router.get("/pending", response_model=List[Ticket])
def pending_tickets() -> List[Ticket]:
    """List all Pending tickets, newest first."""
    return db_helper.get_pending_tickets()


@router.post("/answer", response_model=AnswerResponse)
def answer_ticket(payload: AnswerRequest) -> AnswerResponse:
    """Attach an admin answer to a ticket and mark it Answered."""
    ticket = db_helper.get_ticket(payload.ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail=f"Ticket {payload.ticket_id} not found.")
    db_helper.answer_ticket(payload.ticket_id, payload.answer)
    return AnswerResponse(id=payload.ticket_id, status="Answered")
