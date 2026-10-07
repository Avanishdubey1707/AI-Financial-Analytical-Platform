from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import pandas as pd


@dataclass
class ValidationSummary:
    symbol: str | None
    valid: bool
    issues: list[str]


REQUIRED_COLUMNS = ["Date", "Open", "High", "Low", "Close", "Volume"]


def validate_ohlcv_dataframe(df: pd.DataFrame, symbol: str | None = None) -> pd.DataFrame:
    """Validate and clean OHLCV data.

    The validator accepts a DataFrame with the required columns and fails explicitly
    when the data is invalid. It does not silently mutate bad time series.
    """
    if df is None or df.empty:
        raise ValueError(f"{symbol or 'Stock'} data is empty.")

    issues: list[str] = []
    validated = df.copy()

    missing = [col for col in REQUIRED_COLUMNS if col not in validated.columns]
    if missing:
        raise ValueError(f"Missing required columns for {symbol or 'data'}: {missing}")

    validated = validated[REQUIRED_COLUMNS].copy()
    validated["Date"] = pd.to_datetime(validated["Date"], errors="coerce")
    if validated["Date"].isna().any():
        issues.append("Missing or invalid date values.")

    for column in ["Open", "High", "Low", "Close", "Volume"]:
        validated[column] = pd.to_numeric(validated[column], errors="coerce")

    for column in ["Open", "High", "Low", "Close", "Volume"]:
        if validated[column].isna().any():
            issues.append(f"NaN values detected in {column}.")

    duplicate_dates = validated["Date"].duplicated().sum()
    if duplicate_dates:
        issues.append(f"Duplicate dates detected: {duplicate_dates} rows.")

    if validated["Date"].is_monotonic_increasing is False:
        issues.append("Data is not sorted chronologically.")

    if (validated["Open"] <= 0).any() or (validated["High"] <= 0).any() or (validated["Low"] <= 0).any() or (validated["Close"] <= 0).any():
        issues.append("Zero or negative prices detected.")

    if (validated["Volume"] < 0).any():
        issues.append("Negative volume detected.")

    # Validate OHLC relationships.
    invalid_ohlc = (
        (validated["High"] < validated[["Open", "Close"]].max(axis=1))
        | (validated["Low"] > validated[["Open", "Close"]].min(axis=1))
        | (validated["High"] < validated["Low"])
    )
    if invalid_ohlc.any():
        issues.append("OHLC relationships violate expected constraints: High >= max(Open, Close), Low <= min(Open, Close), High >= Low.")

    if issues:
        raise ValueError(f"Data validation failed for {symbol or 'stock'}: {'; '.join(issues)}")

    validated = validated.sort_values("Date").reset_index(drop=True)
    return validated


__all__ = ["REQUIRED_COLUMNS", "ValidationSummary", "validate_ohlcv_dataframe"]
