# 🧠 AI-Powered Interactive Financial Dashboard

## 📌 Project Overview

This AI-powered interactive financial dashboard is a full-stack solution that extracts, analyzes, and visualizes key financial metrics from company annual reports. It leverages NLP, data visualization, and modern web technologies to empower analysts and stakeholders with real-time, explainable insights into company performance trends across multiple financial years.

## 🎯 Project Objective

The primary goal of this project is to automate the extraction and interpretation of financial metrics from annual reports and present them via a user-friendly, interactive web interface. This reduces manual labor, enhances insight generation, and supports data-driven strategic decision-making.

## 🏗️ Architecture Overview

The solution follows a modular, full-stack architecture consisting of:
- A **Python-based backend (Flask)** to handle financial data ingestion, NLP-based insight generation using LLMs, and API endpoints.
- A **React-based frontend** to render visualizations and enable user interaction with filters, drill-downs, and downloads.
- **CSV files** store normalized financial metrics including revenue, EPS, gross profit, and operating expenses.
- The backend integrates AI (OpenAI or similar) to generate contextual financial insights (e.g., sector performance, anomaly detection).
- Data is visualized using responsive, filterable, and exportable charts using Chart.js and Tailwind CSS.

## 🚀 How to Run the Project

---

### 🛠️ Backend (Flask API)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/ai-financial-dashboard.git
   cd ai-financial-dashboard

2. **Create a Conda virtual environment**:
    ```bash
    conda create -n finance-dashboard python=3.10
    conda activate finance-dashboard

3. **Install backend dependencies**:
    ```bash
    pip install -r backend/requirements.txt

4. **Start the Flask server**:
    ```bash
    cd backend
    python app.py

The backend will be running on: http://localhost:5000/


### 💻 Frontend (React)
1. **Navigate to the frontend directory**:
    ```bash
    cd frontend

2. **Install dependencies**:
    ```bash
    npm install

3. **Start the React development server**:
    ```bash
    npm run dev

The frontend will be running on: http://localhost:5173/


## 📊 Core Features

- Total Revenue (2019–2024) trend line with COVID-19 annotation
- Cost of Sales vs. Operating Expenses (dual-axis bar)
- Gross Profit Margin with tax event markers
- Earnings Per Share (EPS) trend with tooltips
- Net Asset Per Share with benchmarks
- Top 20 Shareholders as interactive table/pie chart
- AI-generated insights using LLM
- Year, Sector, and Currency filters
- Export to PDF/CSV and light/dark mode toggle
- Responsive design and drill-down capability

