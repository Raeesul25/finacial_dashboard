import pandas as pd

def load_and_preprocess_data(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)

    # Remove commas and convert all applicable columns to numeric
    numeric_cols = df.columns.drop(["Year", "Top Twenty Shareholders", "Number of Shares", "Share %"])
    for col in numeric_cols:
        df[col] = df[col].astype(str).str.replace(",", "").str.strip()
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Parse Top Twenty Shareholders as a list
    df["Top Twenty Shareholders"] = df["Top Twenty Shareholders"].apply(
        lambda x: [item.strip() for item in str(x).split(',')] if pd.notnull(x) else []
    )

    # Convert "Number of Shares" to list of integers
    df["Number of Shares"] = df["Number of Shares"].apply(
        lambda x: [int(item.strip()) for item in str(x).split(',')] if pd.notnull(x) else []
    )

    # Convert "Share %" to list of floats
    df["Share %"] = df["Share %"].apply(
        lambda x: [float(item.strip()) for item in str(x).split(',')] if pd.notnull(x) else []
    )

    # Fill NaNs with 0 for now (you can handle it differently if needed)
    df[numeric_cols] = df[numeric_cols].fillna(0)

    return df

if __name__=='__main__':
    file_path = "D:/Assesments/AI Financial Dashboard/backend/data/extracted_data/Extracted_Data.csv"
    results = load_and_preprocess_data(file_path)
    print(results)