# Necessary Libraries
import os
import fitz  # PyMuPDF
import google.generativeai as genai
from langchain_astradb import AstraDBVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.documents import Document
from groq import Groq
from langchain.chains import RetrievalQA
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

## 1. Load PDF and Chunk by Page
def load_and_chunk_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    all_chunks = []

    for page_num in range(len(doc)):
        page_text = doc[page_num].get_text()
        metadata = {"source": pdf_path, "page": page_num + 1}

        if page_text.strip():
            all_chunks.append(Document(page_content=page_text, metadata=metadata))

    return all_chunks


## 2. Store in Astra Vector DB
def store_in_astra(status, chunks, embedding):
    vectorstore = AstraDBVectorStore(
        embedding = embedding,
        collection_name = "annual_report_19_20",
        api_endpoint = os.getenv("ASTRA_DB_API_ENDPOINT"),
        token = os.getenv("ASTRA_DB_APPLICATION_TOKEN"),
        namespace = os.getenv("ASTRA_DB_KEYSPACE")
    )

    storage = status

    if storage == None:
        vectorstore.add_documents(chunks)
        return vectorstore
    else:
        print("Vectors Already Stored....")
        return vectorstore


## 3. RAG Prompt Template
def generate_prompt():
    return """
You are a financial data extraction expert. 
Extract the following financial information from the provided text chunks of an annual report. 
The report contains financial information for two years. 
Ensure high accuracy, return only what's explicitly stated, and include the corresponding page number for every metric extracted.

Extract the data in structured JSON format as shown below:

{
  "Total Revenue": {
    Year 1: {"Transportation": <amount>, "Retail": <amount>, ..., "Group Revenue": <amount>, "Page": <page_number>},
    Year 2: {"Transportation": <amount>, "Retail": <amount>, ..., "Group Revenue": <amount>, "Page": <page_number>}
  },
  "Earnings Per Share (EPS)": {
    Year 1: {"EPS": <value>, "Page": <page_number>},
    Year 2: {"EPS": <value>, "Page": <page_number>}
  },
  "Cost of Sales": {
    Year 1: {"Cost of Sales": <amount>, "Page": <page_number>},
    Year 2: {"Cost of Sales": <amount>, "Page": <page_number>}
  },
  "Operating Expenses": {
    Year 1: {
      "Selling and distribution expenses": <amount>,
      "Administrative expenses": <amount>,
      "Other operating expenses": <amount>,
      "Page": <page_number>
    },
    Year 2: {
      "Selling and distribution expenses": <amount>,
      "Administrative expenses": <amount>,
      "Other operating expenses": <amount>,
      "Page": <page_number>
    }
  },
  "Gross Profit": {
    Year 1: {"Gross Profit": <amount>, "Page": <page_number>},
    Year 2: {"Gross Profit": <amount>, "Page": <page_number>}
  },
  "Net Asset Per Share": {
    Year 1: {"Net Asset Per Share": <amount>, "Page": <page_number>},
    Year 2: {"Net Asset Per Share": <amount>, "Page": <page_number>}
  },
  "Top Twenty Shareholders": {
    "Shareholders": [<name_1>, <name_2>, ..., <name_20>],
    "Page": <page_number>
  }
}

❗IMPORTANT:
- Use only the data from the text provided; do not guess or infer.
- Use the exact names and values as written in the document (even if in LKR or USD).
- If the document contains tables, summarize them in text or structured JSON as shown above.
- If data is unavailable in the provided text, skip the field.

ONLY use content from the context. If unsure, return "Not Found".
    """


## 4. Run RAG + Return JSON Output
def extract_financial_data(pdf_path):
    print(f"Processing: {pdf_path}")

    print("Load to chunk....")
    chunks = load_and_chunk_pdf(pdf_path)

    embedding = GoogleGenerativeAIEmbeddings(model = "models/embedding-001")
    
    print("Store in VectorDB....")
    vectorstore = store_in_astra("Status", chunks, embedding)

    print("Retrive Process....")
    retriever = vectorstore.as_retriever(search_type="mmr", k=25)
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash-001", temperature=0.3)

    chain = RetrievalQA.from_chain_type(
        llm = llm,
        retriever = retriever,
        chain_type = "stuff",
        # return_source_documents = True
    )

    prompt = generate_prompt()

    print("LLM Generation....")
    response = chain.run(prompt)
    return response

if __name__=='__main__':
    file_path = "D:/Assesments/AI Financial Dashboard/backend/data/annual_reports/Annual Report 19-20.pdf"
    results = extract_financial_data(file_path)
    print(results)