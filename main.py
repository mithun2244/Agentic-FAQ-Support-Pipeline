import streamlit as st
from langchain_helper import get_qa_chain, create_vector_db

st.set_page_config(
    page_title="Agentic FAQ Support Pipeline",
    page_icon="🌱",
    layout="centered",
)

# --- Custom CSS: hide default Streamlit chrome for a standalone-app feel ---
st.markdown(
    """
    <style>
        #MainMenu {visibility: hidden;}
        header {visibility: hidden;}
        footer {visibility: hidden;}
        .block-container {padding-top: 2.5rem;}
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_resource(show_spinner=False)
def load_chain():
    """Load the RetrievalQA chain once and reuse it across reruns."""
    return get_qa_chain()


# --- Sidebar: data ingestion controls ---
with st.sidebar:
    st.header("⚙️ Data Ingestion & Indexing")
    st.caption(
        "Build or refresh the FAISS vector store from the FAQ knowledge base. "
        "Run this once on first setup, or whenever the source FAQs change."
    )
    if st.button("Create Knowledgebase", use_container_width=True):
        with st.spinner("Embedding FAQs with NVIDIA NIM and building the index..."):
            create_vector_db()
        load_chain.clear()  # invalidate cached chain so it reloads the new index
        st.success("Knowledgebase created successfully.")

    st.divider()
    st.caption("Powered by NVIDIA NIM · LLaMA 3.1 8B · nv-embedqa-e5-v5")


# --- Main: chat interface ---
st.title("Agentic FAQ Support Pipeline 🌱")
st.caption("Ask questions and get grounded answers sourced directly from the FAQ knowledge base.")

if "messages" not in st.session_state:
    st.session_state.messages = []

# Replay chat history
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

question = st.chat_input("Ask a question about Codebasics courses...")

if question:
    # Show and store the user's question
    st.session_state.messages.append({"role": "user", "content": question})
    with st.chat_message("user"):
        st.markdown(question)

    # Generate and render the assistant's answer
    with st.chat_message("assistant"):
        try:
            chain = load_chain()
            with st.spinner("Thinking..."):
                response = chain.invoke(question)
            answer = response["result"]
        except Exception as e:
            answer = (
                "I couldn't answer that. Make sure the knowledgebase has been built "
                f"(use the sidebar) and the NVIDIA API key is configured.\n\n`{e}`"
            )
        st.markdown(answer)

    st.session_state.messages.append({"role": "assistant", "content": answer})
