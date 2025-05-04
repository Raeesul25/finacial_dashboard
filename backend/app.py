from flask import Flask, jsonify
from flask_cors import CORS
from services.data_cleaner import load_and_preprocess_data
from services.metrics import calculate_financial_metrics
from services.ai_insights import generate_insights, clean_llm_output

app = Flask(__name__)
CORS(app)
DATA_PATH = "D:/Assesments/AI Financial Dashboard/backend/data/extracted_data/Extracted_Data.csv"

@app.route("/raw", methods=["GET"])
def get_raw_data():
    df = load_and_preprocess_data(DATA_PATH)
    return jsonify(df.to_dict(orient="records"))

@app.route("/metrics", methods=["GET"])
def get_metrics():
    df = load_and_preprocess_data(DATA_PATH)
    df_metrics = calculate_financial_metrics(df)
    df_metrics = df_metrics.fillna(0)
    return jsonify(df_metrics.to_dict(orient="records"))

@app.route('/insights', methods=['GET'])
def get_insights():
    try:
        insights = generate_insights()  # This reads CSV and prompts the LLM
        return jsonify({'success': True, 'insights': insights})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == "__main__":
    app.run(debug=True)
