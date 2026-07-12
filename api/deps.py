"""Shared dependencies for the API layer."""
from functools import lru_cache

import langchain_helper


@lru_cache(maxsize=1)
def get_chain():
    """Load the FAISS-backed RetrievalQA chain once and reuse it across requests.

    Loaded lazily on the first /ask call so the app can start even before the
    knowledge base has been built.
    """
    return langchain_helper.get_qa_chain()
