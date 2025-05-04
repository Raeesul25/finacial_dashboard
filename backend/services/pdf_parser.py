# Necessary Libraries
import os
import re
import json
import fitz  # PyMuPDF
import google.generativeai as genai
import pdfplumber
import pandas as pd
from typing import List, Dict
from langchain_astradb import AstraDBVectorStore
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from groq import Groq
from langchain.chains import RetrievalQA
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

## 1. PDF Parse
def parse_pdf_with_structure(filepath: str) -> List[Dict]:
    parsed_pages = []

    with pdfplumber.open(filepath) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            page_content = []

            # Extract words for block-level reading order
            words = page.extract_words()
            lines = page.extract_text().split("\n") if page.extract_text() else []

            # Step 1: Try structured text first
            for line in lines:
                if line.strip():
                    page_content.append({"type": "text", "content": line.strip()})

            # Step 2: Extract tables and place in sequence (approximate layout)
            table = page.extract_table()
            if table:
                table_str = "\n".join(["\t".join(str(cell or '') for cell in row) for row in table])
                page_content.append({"type": "table", "content": table_str})

            parsed_pages.append({
                "page": page_num,
                "elements": page_content
            })

    return parsed_pages

## 3. Flatten structured text+table data into chunks
def flatten_parsed_pdf(parsed_pages):
    flat_text_blocks = []
    for page in parsed_pages:
        for element in page["elements"]:
            prefix = f"Page {page['page']} [{element['type'].upper()}]: "
            flat_text_blocks.append(prefix + element["content"])
    return flat_text_blocks

## 4. Chunk the text using overlapping window
def chunk_text_blocks(blocks, chunk_size=3000, chunk_overlap=500):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", " ", ""]
    )
    full_text = "\n\n".join(blocks)
    return text_splitter.create_documents([full_text])

## 5. Store in Astra Vector DB
def store_in_astra(chunks, embedding):
    vectorstore = AstraDBVectorStore(
        embedding = embedding,
        collection_name = "annual_report_19_20",
        api_endpoint = os.getenv("ASTRA_DB_API_ENDPOINT"),
        token = os.getenv("ASTRA_DB_APPLICATION_TOKEN"),
        namespace = os.getenv("ASTRA_DB_KEYSPACE")
    )

    
    vectorstore.add_documents(chunks)
    return vectorstore

## 5. Store in Astra Vector DB
def get_in_astra(embedding):
    vectorstore = AstraDBVectorStore(
        embedding = embedding,
        collection_name = "annual_report_19_20",
        api_endpoint = os.getenv("ASTRA_DB_API_ENDPOINT"),
        token = os.getenv("ASTRA_DB_APPLICATION_TOKEN"),
        namespace = os.getenv("ASTRA_DB_KEYSPACE")
    )

    return vectorstore

## 6. RAG Prompt Template
def generate_prompt():
    return """
You are a financial data extraction assistant.

From the retrieved documents, extract the following data for the year 2020:

1. Total Revenue for each Industry Group:
   - Transportation
   - Retail
   - Consumer Foods
   - Leisure
   - Property
   - Financial Services
   - Others

2. Total Group Revenue in LKR

3. From the Income Statement, extract:
   - Earnings Per Share (EPS)
   - Net Profit
   - Cost of Sales
   - Gross Profit
   - Net Asset Per Share

4. Operating Expenses in LKR:
   - Selling and distribution expenses
   - Administrative expenses
   - Other operating expenses

5. Top 20 Shareholders:
   - List of shareholder names
   - Number of shares
   - Shareholding percentage (%)

Return your response strictly in the following JSON format:
{{
  "year": "2020",
  "industry_group_revenue": {{
    "Transportation": "...",
    "Retail": "...",
    "Consumer Foods": "...",
    "Leisure": "...",
    "Property": "...",
    "Financial Services": "...",
    "Others": "..."
  }},
  "total_group_revenue_lkr": "...",
  "income_statement": {{
    "EPS": "...",
    "Net Profit": "...",
    "Cost of Sales": "...",
    "Gross Profit": "...",
    "Net Asset Per Share": "..."
  }},
  "operating_expenses_lkr": {{
    "Selling and distribution": "...",
    "Administrative": "...",
    "Other operating": "..."
  }},
  "top_20_shareholders": {{
    "names": [...],
    "shares": [...],
    "percentages": [...]
  }}
}}

Only extract information relevant to the year 2020. If data is missing, return null for that field.
"""

def parse_llm_json_response(llm_response: str) -> dict:
    
    try:
        # Extract content between ```json ... ```
        json_str_match = re.search(r"```json(.*?)```", llm_response, re.DOTALL)
        json_raw = json_str_match.group(1).strip() if json_str_match else llm_response.strip()
        
        # Remove commas inside numbers using regex
        # Matches any quoted number with commas
        json_clean = re.sub(r'"([\d,]+)"', lambda m: '"' + m.group(1).replace(",", "") + '"', json_raw)
        
        return json.loads(json_clean)

    except json.JSONDecodeError as e:
        print("JSON parsing error:", e)
        return {}
    
## 7. Preprocessing
def preprocess_financial_data(data):

    row = {
        "Year": data.get("year"),
        "Transportation": data.get("industry_group_revenue", {}).get("Transportation"),
        "Consumer Foods": data.get("industry_group_revenue", {}).get("Consumer Foods"),
        "Retail": data.get("industry_group_revenue", {}).get("Retail"),
        "Leisure": data.get("industry_group_revenue", {}).get("Leisure"),
        "Property": data.get("industry_group_revenue", {}).get("Property"),
        "Financial Services": data.get("industry_group_revenue", {}).get("Financial Services"),
        "Others": data.get("industry_group_revenue", {}).get("Others"),
        "Total Revenue": data.get("total_group_revenue_lkr"),
        "Earnings Per Share (EPS)": data.get("income_statement", {}).get("EPS"),
        "Net Profit": data.get("income_statement", {}).get("Net Profit"),
        "Cost of Sales": data.get("income_statement", {}).get("Cost of Sales"),
        "Gross Profit": data.get("income_statement", {}).get("Gross Profit"),
        "Net Asset Per Share": data.get("income_statement", {}).get("Net Asset Per Share"),
        "Selling and distribution expenses": data.get("operating_expenses_lkr", {}).get("Selling and distribution"),
        "Administrative expenses": data.get("operating_expenses_lkr", {}).get("Administrative"),
        "Other operating expenses": data.get("operating_expenses_lkr", {}).get("Other operating"),
        "Top Twenty Shareholders": ", ".join(data.get("top_20_shareholders", {}).get("names", [])),
        "Number of Shares": ", ".join(data.get("top_20_shareholders", {}).get("shares", [])),
        "Share %": ", ".join(data.get("top_20_shareholders", {}).get("percentages", [])),
    }

    return pd.DataFrame([row])

## 8. Run RAG + Return JSON Output
def extract_financial_data(status, pdf_path):
    
    embedding = GoogleGenerativeAIEmbeddings(model = "models/embedding-001")

    if status == None:
        print(f"Processing: {pdf_path}")
        parsed = parse_pdf_with_structure(pdf_path)

        print("Flatten structured into chunks....")
        blocks = flatten_parsed_pdf(parsed)

        print("Chunk the text....")
        chunks = chunk_text_blocks(blocks)
        
        print("Store in VectorDB....")
        vectorstore = store_in_astra(chunks, embedding)

    else:
        print("Getting data from VectorDB....")
        vectorstore = get_in_astra(embedding)

    print("Retrive Process....")
    retriever = vectorstore.as_retriever(search_type="mmr", k=20)
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash-001", temperature=0.3)
    prompt_template = generate_prompt()
    chain = RetrievalQA.from_chain_type(
        llm = llm,
        retriever = retriever,
        chain_type = "stuff",
        return_source_documents = False
    )

    print("LLM Generation....")
    year_input = "2020"
    # prompt = PromptTemplate(template = prompt_template)
    response = chain.run(prompt_template)
    # print(response)
    print("Preprocessing Extracted Data....")
    json_data = parse_llm_json_response(response)
    # print(json_data)
    df_financials = preprocess_financial_data(json_data)
    
    return df_financials

if __name__=='__main__':
    file_path = "D:/Assesments/AI Financial Dashboard/backend/data/annual_reports/Annual Report 19-20.pdf"
    results = extract_financial_data("Yes", file_path)
    # print(results)
    results.to_csv("D:/Assesments/AI Financial Dashboard/backend/data/extracted_data/extracted_2020.csv", 
                   index=False)