"""Shared pytest fixtures for the FastAPI backend tests."""
# NVIDIA_API_KEY must be set before importing the app (langchain_helper builds
# the NVIDIA clients at import time); pytest fixtures also shadow their own
# names in test signatures, which is the idiomatic pattern.
# pylint: disable=wrong-import-position,redefined-outer-name,unused-argument
import os

os.environ.setdefault("NVIDIA_API_KEY", "test-key-not-used")

import pytest
from fastapi.testclient import TestClient

import db_helper
from api.deps import get_chain
from api.main import app


class FakeChain:
    """Stand-in for the RetrievalQA chain so /ask can be tested offline."""

    def __init__(self, answer):
        self._answer = answer

    def invoke(self, _question):
        """Mimic RetrievalQA.invoke, returning a result dict."""
        return {"result": self._answer}


@pytest.fixture
def temp_db(tmp_path, monkeypatch):
    """Point the ticket store at a throwaway SQLite file for each test."""
    monkeypatch.setattr(db_helper, "DB_PATH", str(tmp_path / "tickets.db"))
    db_helper.init_db()


@pytest.fixture
def client(temp_db):
    """A TestClient bound to the temp DB; clears dependency overrides after."""
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def fake_answer():
    """Return a helper that makes /ask serve a canned answer (no LLM call)."""

    def _set(answer):
        app.dependency_overrides[get_chain] = lambda: FakeChain(answer)

    return _set
