"""Lightweight SQLite manager for the human-in-the-loop fallback ticketing system.

Stores questions the LLM could not answer as 'Pending' tickets, lets an admin
answer them ('Answered'), and lets the app resolve future questions from the
pool of previously answered tickets.
"""
import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tickets.db")


def _connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create the tickets table if it does not exist. Safe to call repeatedly."""
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS tickets (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                question   TEXT NOT NULL,
                answer     TEXT,
                status     TEXT NOT NULL DEFAULT 'Pending',
                contact    TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        conn.commit()


def create_ticket(question, contact=None):
    """Log an unanswered question as a Pending ticket. Returns the new ticket id."""
    init_db()
    with _connect() as conn:
        cur = conn.execute(
            "INSERT INTO tickets (question, contact, status) VALUES (?, ?, 'Pending')",
            (question.strip(), (contact or None)),
        )
        conn.commit()
        return cur.lastrowid


def get_ticket(ticket_id):
    """Return a single ticket as a dict, or None if it does not exist."""
    init_db()
    with _connect() as conn:
        row = conn.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
    return dict(row) if row else None


def get_pending_tickets():
    """Return all Pending tickets, newest first, as a list of dicts."""
    init_db()
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM tickets WHERE status = 'Pending' ORDER BY id DESC"
        ).fetchall()
    return [dict(r) for r in rows]


def answer_ticket(ticket_id, answer):
    """Attach an admin answer to a ticket and mark it Answered."""
    init_db()
    with _connect() as conn:
        conn.execute(
            "UPDATE tickets SET answer = ?, status = 'Answered' WHERE id = ?",
            (answer.strip(), ticket_id),
        )
        conn.commit()


def find_answered(question):
    """Resolution check: if a previously Answered ticket matches this question
    (case-insensitive, whitespace-normalized), return its answer; else None.
    """
    init_db()
    norm = " ".join(question.strip().lower().split())
    with _connect() as conn:
        rows = conn.execute(
            "SELECT question, answer FROM tickets "
            "WHERE status = 'Answered' AND answer IS NOT NULL AND TRIM(answer) != ''"
        ).fetchall()
    for r in rows:
        if " ".join(r["question"].strip().lower().split()) == norm:
            return r["answer"]
    return None
