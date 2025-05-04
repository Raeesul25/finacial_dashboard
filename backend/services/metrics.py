import pandas as pd

def calculate_financial_metrics(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values("Year")

    # Revenue Growth (%)
    df["Revenue Growth (%)"] = (df["Total Revenue"].pct_change() * 100).round(2)

    # Gross Margin (%) = Gross Profit / Total Revenue
    df["Gross Margin (%)"] = ((df["Gross Profit"] / df["Total Revenue"]) * 100).round(2)

    # Operating Expenses Total
    df["Total Operating Expenses"] = (
        df["Selling and distribution expenses"]
        + df["Administrative expenses"]
        + df["Other operating expenses"]
    )

    # Operating Expense Ratio = Total Operating Expenses / Total Revenue
    df["Operating Expense Ratio (%)"] = ((
        df["Total Operating Expenses"] / df["Total Revenue"]
    ) * 100).round(2)

    # EPS Growth
    df["EPS Growth (%)"] = (df["Earnings Per Share (EPS)"].pct_change() * 100).round(2)

    # Net Profit Growth
    df["Net Profit Growth (%)"] = (df["Net Profit"].pct_change() * 100).round(2)

    # Net Asset Per Share Growth
    df["Net Asset Growth (%)"] = (df["Net Asset Per Share"].pct_change() * 100).round(2)

    return df

