"""End-to-end tests for the FastAPI backend (offline; the RAG chain is faked)."""
# pylint: disable=redefined-outer-name
import db_helper


def test_health(client):
    """/health returns an ok status."""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_ticket_lifecycle(client):
    """Create -> list pending -> answer, with a 404 for an unknown id."""
    resp = client.post("/tickets", json={"question": "Do you have a Go course?", "contact": "u@x"})
    assert resp.status_code == 201
    ticket_id = resp.json()["id"]

    pending = client.get("/tickets/pending").json()
    assert any(t["id"] == ticket_id for t in pending)

    missing = client.post("/tickets/answer", json={"ticket_id": 99999, "answer": "x"})
    assert missing.status_code == 404

    answered = client.post("/tickets/answer", json={"ticket_id": ticket_id, "answer": "Not yet."})
    assert answered.status_code == 200
    assert answered.json()["status"] == "Answered"
    assert all(t["id"] != ticket_id for t in client.get("/tickets/pending").json())


def test_ask_returns_rag_answer(client, fake_answer):
    """A confident RAG answer comes back as source=rag, resolved=True."""
    fake_answer("Yes, we offer that course.")
    resp = client.post("/ask", json={"question": "Do you offer that?"})
    body = resp.json()
    assert resp.status_code == 200
    assert body["source"] == "rag"
    assert body["resolved"] is True
    assert body["answer"] == "Yes, we offer that course."


def test_ask_flags_fallback_on_dont_know(client, fake_answer):
    """An 'I don't know' answer sets resolved=False so the UI can escalate."""
    fake_answer("I don't know.")
    body = client.post("/ask", json={"question": "Something obscure?"}).json()
    assert body["source"] == "rag"
    assert body["resolved"] is False


def test_ask_resolves_from_prior_ticket(client, fake_answer):
    """A previously answered ticket short-circuits the LLM (source=ticket)."""
    ticket_id = db_helper.create_ticket("What is the refund policy?", "u@x")
    db_helper.answer_ticket(ticket_id, "Full refund within 7 days.")
    fake_answer("SHOULD NOT BE USED")
    body = client.post("/ask", json={"question": "  what is the REFUND policy?  "}).json()
    assert body["source"] == "ticket"
    assert body["resolved"] is True
    assert body["answer"] == "Full refund within 7 days."


def test_ask_rejects_empty_question(client, fake_answer):
    """Whitespace-only questions are rejected before hitting the chain."""
    fake_answer("unused")
    assert client.post("/ask", json={"question": "   "}).status_code == 422
