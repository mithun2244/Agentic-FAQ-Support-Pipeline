"""LangChain + NVIDIA NIM helper: builds the FAISS knowledge base and the
RetrievalQA chain used by the Streamlit app to answer FAQ questions."""
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders.csv_loader import CSVLoader
from langchain_core.prompts import PromptTemplate
from langchain_nvidia_ai_endpoints import ChatNVIDIA, NVIDIAEmbeddings
from langchain_classic.chains import RetrievalQA
from dotenv import load_dotenv

load_dotenv()  # take environment variables from .env (especially NVIDIA_API_KEY)

# Create NVIDIA NIM LLM model
llm = ChatNVIDIA(model="meta/llama-3.1-8b-instruct")
# Initialize NVIDIA NIM embeddings
embeddings = NVIDIAEmbeddings(model="nvidia/nv-embedqa-e5-v5")
VECTORDB_FILE_PATH = "faiss_index"


def create_vector_db():
    """Embed the FAQ CSV with NVIDIA NIM and persist a local FAISS index."""
    # Load data from FAQ sheet
    loader = CSVLoader(file_path="codebasics_faqs.csv", source_column="prompt")
    data = loader.load()

    # Create a FAISS instance for vector database from 'data'
    vectordb = FAISS.from_documents(documents=data, embedding=embeddings)

    # Save vector database locally
    vectordb.save_local(VECTORDB_FILE_PATH)


def get_qa_chain():
    """Load the persisted FAISS index and return a RetrievalQA chain."""
    # Load the vector database from the local folder
    vectordb = FAISS.load_local(
        VECTORDB_FILE_PATH, embeddings, allow_dangerous_deserialization=True
    )

    # Create a retriever for querying the vector database
    retriever = vectordb.as_retriever(score_threshold=0.7)

    prompt_template = """Given the following context and a question, generate an answer based on this context only.
    In the answer try to provide as much text as possible from "response" section in the source document context without making much changes.
    If the answer is not found in the context, kindly state "I don't know." Don't try to make up an answer.

    CONTEXT: {context}

    QUESTION: {question}"""

    prompt = PromptTemplate(
        template=prompt_template, input_variables=["context", "question"]
    )

    chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        input_key="query",
        return_source_documents=True,
        chain_type_kwargs={"prompt": prompt},
    )

    return chain


if __name__ == "__main__":
    create_vector_db()
    qa_chain = get_qa_chain()
    print(qa_chain.invoke("Do you have javascript course?"))
