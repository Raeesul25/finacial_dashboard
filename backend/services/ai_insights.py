import os
import re
import pandas as pd
import google.generativeai as genai
from langchain_google_genai import GoogleGenerativeAI
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))


def clean_llm_output(text):
    lines = text.split('\n')
    cleaned_lines = [
        re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', line.strip().lstrip('*').strip())
        for line in lines if line.strip() and not line.strip().startswith('#')
    ]
    return cleaned_lines


def generate_insights():
    df = pd.read_csv("D:/Assesments/AI Financial Dashboard/backend/data/extracted_data/Extracted_Data.csv")

    # Extract sample context as a summary input
    trend_context = df.to_string(index=False)

    prompt_template = PromptTemplate.from_template("""
    Analyze the following 6-year financial metrics and generate 4 to 6 strategic insights.
    Focus on trends, major dips, YoY changes, sector performance, or anomalies.
    Respond in bullet points, avoiding generic commentary.
    \n\nFinancial Metrics:\n{trend_context}
    """)

    llm = GoogleGenerativeAI(model="gemini-1.5-flash-001", temperature=0.3)  # or use Groq w/ Llama3
    prompt = prompt_template.format(trend_context=trend_context)
    insight_raw = llm.invoke(prompt)
    cleaned = clean_llm_output(insight_raw)

    return '\n'.join(f'{line}' for line in cleaned)

if __name__=='__main__':
    results = generate_insights()
    print(results)