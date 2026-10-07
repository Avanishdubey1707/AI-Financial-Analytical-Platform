from __future__ import annotations

from typing import Any

import pandas as pd


def sanitize_prediction_frame(prediction: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """Apply conservative, documented corrections to a raw Kronos forecast.

    The goal is to preserve the signal while ensuring every candle satisfies the
    basic OHLCV validity constraints required by downstream analytics.
    """
    raw = prediction.copy()
    corrections: list[str] = []

    for column in ["Open", "High", "Low", "Close", "Volume"]:
        if column in raw.columns:
            raw[column] = pd.to_numeric(raw[column], errors="coerce")

    for idx in raw.index:
        row = raw.loc[idx]
        high = float(row["High"])
        low = float(row["Low"])
        open_px = float(row["Open"])
        close_px = float(row["Close"])
        volume = float(row["Volume"])

        if pd.isna(open_px) or open_px <= 0:
            raw.at[idx, "Open"] = max(1e-6, abs(close_px) if pd.notna(close_px) else 1.0)
            corrections.append(f"Row {idx}: corrected Open to positive value.")
        if pd.isna(close_px) or close_px <= 0:
            raw.at[idx, "Close"] = max(1e-6, abs(open_px) if pd.notna(open_px) else 1.0)
            corrections.append(f"Row {idx}: corrected Close to positive value.")
        if pd.isna(high) or high <= 0:
            raw.at[idx, "High"] = max(open_px, close_px, 1.0)
            corrections.append(f"Row {idx}: corrected High to at least the current [Open, Close] maximum.")
        if pd.isna(low) or low <= 0:
            raw.at[idx, "Low"] = min(open_px, close_px, raw.at[idx, "High"]) * 0.999
            corrections.append(f"Row {idx}: corrected Low to a positive, non-zero value.")
        if raw.at[idx, "Volume"] < 0 or pd.isna(raw.at[idx, "Volume"]):
            raw.at[idx, "Volume"] = 0.0
            corrections.append(f"Row {idx}: corrected negative or missing Volume to zero.")

        max_price = max(float(raw.at[idx, "Open"]), float(raw.at[idx, "Close"]))
        min_price = min(float(raw.at[idx, "Open"]), float(raw.at[idx, "Close"]))
        if float(raw.at[idx, "High"]) < max_price:
            raw.at[idx, "High"] = max_price
            corrections.append(f"Row {idx}: enforced High >= max(Open, Close).")
        if float(raw.at[idx, "Low"]) > min_price:
            raw.at[idx, "Low"] = min_price
            corrections.append(f"Row {idx}: enforced Low <= min(Open, Close).")
        if float(raw.at[idx, "High"]) < float(raw.at[idx, "Low"]):
            raw.at[idx, "High"], raw.at[idx, "Low"] = float(raw.at[idx, "Low"]), float(raw.at[idx, "High"])
            corrections.append(f"Row {idx}: corrected inverted High/Low ordering.")

    return raw, corrections


__all__ = ["sanitize_prediction_frame"]
