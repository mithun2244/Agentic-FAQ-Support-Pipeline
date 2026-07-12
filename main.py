import streamlit as st
from langchain_helper import get_qa_chain, create_vector_db
import db_helper

ADMIN_PASSWORD = "admin123"  # demo only — replace with a real secret in production

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

db_helper.init_db()

# --- Session state defaults ---
st.session_state.setdefault("messages", [])
st.session_state.setdefault("fallback_question", None)
st.session_state.setdefault("show_contact_form", False)
st.session_state.setdefault("ticket_submitted", False)
st.session_state.setdefault("admin_authed", False)


@st.cache_resource(show_spinner=False)
def load_chain():
    """Load the RetrievalQA chain once and reuse it across reruns."""
    return get_qa_chain()


def is_dont_know(text):
    t = text.lower()
    return "i don't know" in t or "i dont know" in t


# ============================ SIDEBAR ============================
with st.sidebar:
    st.header("⚙️ Data Ingestion & Indexing")
    st.caption(
        "Build or refresh the FAISS vector store from the FAQ knowledge base. "
        "Run this once on first setup, or whenever the source FAQs change."
    )
    if st.button("Create Knowledgebase", use_container_width=True):
        with st.spinner("Embedding FAQs with NVIDIA NIM and building the index..."):
            create_vector_db()
        load_chain.clear()
        st.success("Knowledgebase created successfully.")

    st.caption("Powered by NVIDIA NIM · LLaMA 3.1 8B · nv-embedqa-e5-v5")

    st.divider()

    # ---- Admin Portal (password protected) ----
    st.header("🔐 Admin Portal")
    if not st.session_state.admin_authed:
        pw = st.text_input("Password", type="password", key="admin_pw")
        if st.button("Login", use_container_width=True):
            if pw == ADMIN_PASSWORD:
                st.session_state.admin_authed = True
                st.rerun()
            else:
                st.error("Incorrect password.")
    else:
        pending_count = len(db_helper.get_pending_tickets())
        st.success(f"Logged in. {pending_count} pending ticket(s).")
        if st.button("Log out", use_container_width=True):
            st.session_state.admin_authed = False
            st.rerun()


# ============================ ADMIN DASHBOARD ============================
def render_admin_dashboard():
    st.subheader("🛠️ Admin Portal — Pending Tickets")
    pending = db_helper.get_pending_tickets()
    if not pending:
        st.info("No pending tickets right now. 🎉")
        return
    for t in pending:
        with st.container(border=True):
            st.markdown(f"**Ticket #{t['id']}** · _{t['created_at']}_")
            st.markdown(f"**Question:** {t['question']}")
            if t.get("contact"):
                st.caption(f"📇 Contact: {t['contact']}")
            answer = st.text_area(
                "Your answer", key=f"answer_{t['id']}", placeholder="Type the resolution here..."
            )
            if st.button("Send Answer", key=f"send_{t['id']}", type="primary"):
                if answer.strip():
                    db_helper.answer_ticket(t["id"], answer)
                    st.success(f"Ticket #{t['id']} answered and marked resolved.")
                    st.rerun()
                else:
                    st.warning("Please type an answer before sending.")


# ============================ MAIN VIEW ============================
st.title("Agentic FAQ Support Pipeline 🌱")
st.caption("Ask questions and get grounded answers sourced directly from the FAQ knowledge base.")

if st.session_state.admin_authed:
    render_admin_dashboard()
    st.divider()

# ---- Chat history ----
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

question = st.chat_input("Ask a question about our courses...")

if question:
    # reset any prior fallback / submission state for the new turn
    st.session_state.show_contact_form = False
    st.session_state.ticket_submitted = False

    st.session_state.messages.append({"role": "user", "content": question})
    with st.chat_message("user"):
        st.markdown(question)

    # 1) Resolution check — has an admin already answered this exact question?
    prior = db_helper.find_answered(question)
    if prior:
        answer = f"✅ **Answered by our support team:**\n\n{prior}"
        dont_know = False
    else:
        # 2) Otherwise run the NVIDIA NIM RAG chain
        try:
            chain = load_chain()
            with st.spinner("Thinking..."):
                response = chain.invoke(question)
            answer = response["result"]
            dont_know = is_dont_know(answer)
        except Exception as e:
            answer = (
                "I couldn't answer that. Make sure the knowledgebase has been built "
                f"(use the sidebar) and the NVIDIA API key is configured.\n\n`{e}`"
            )
            dont_know = False

    with st.chat_message("assistant"):
        st.markdown(answer)
    st.session_state.messages.append({"role": "assistant", "content": answer})

    # 3) Arm the fallback ticket flow if the model couldn't answer
    st.session_state.fallback_question = question if dont_know else None

# ---- Fallback ticket flow (state-driven so it survives reruns) ----
if st.session_state.ticket_submitted:
    st.success("Ticket submitted successfully! Our team will review it.")
    st.session_state.ticket_submitted = False

elif st.session_state.fallback_question:
    if not st.session_state.show_contact_form:
        st.info("I couldn't find this in our knowledge base.")
        if st.button("📩 Contact Customer Service", type="primary"):
            st.session_state.show_contact_form = True
            st.rerun()
    else:
        with st.container(border=True):
            st.markdown("**Submit your question to our support team**")
            st.caption(f"Question: _{st.session_state.fallback_question}_")
            contact = st.text_input("Your email or Discord tag (optional)", key="contact_input")
            col1, col2 = st.columns([1, 1])
            with col1:
                if st.button("Submit ticket", type="primary", use_container_width=True):
                    db_helper.create_ticket(st.session_state.fallback_question, contact)
                    st.session_state.fallback_question = None
                    st.session_state.show_contact_form = False
                    st.session_state.ticket_submitted = True
                    st.rerun()
            with col2:
                if st.button("Cancel", use_container_width=True):
                    st.session_state.fallback_question = None
                    st.session_state.show_contact_form = False
                    st.rerun()
