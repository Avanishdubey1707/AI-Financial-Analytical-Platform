from __future__ import annotations

import numpy as np
import pandas as pd


def mean_absolute_error(actual: pd.Series, predicted: pd.Series) -> float:
    return float(np.abs(actual - predicted).mean())


def root_mean_squared_error(actual: pd.Series, predicted: pd.Series) -> float:
    return float(np.sqrt(np.mean((actual - predicted) ** 2)))


def mean_absolute_percentage_error(actual: pd.Series, predicted: pd.Series) -> float:
    denom = np.abs(actual).replace(0, np.nan)
    errors = np.abs(actual - predicted) / denom
    return float(errors.mean() * 100.0)


def directional_accuracy(actual: pd.Series, predicted: pd.Series) -> float:
    if len(actual) != len(predicted):
        raise ValueError("actual and predicted series must have the same length.")
    actual_direction = actual.pct_change().fillna(0).gt(0).astype(int)
    predicted_direction = predicted.pct_change().fillna(0).gt(0).astype(int)
    return float((actual_direction == predicted_direction).mean() * 100.0)


def compute_metrics(actual: pd.DataFrame, predicted: pd.DataFrame) -> dict[str, float]:
    actual_close = pd.to_numeric(actual["Close"], errors="coerce")
    predicted_close = pd.to_numeric(predicted["Close"], errors="coerce")
    return {
        "MAE": mean_absolute_error(actual_close, predicted_close),
        "RMSE": root_mean_squared_error(actual_close, predicted_close),
        "MAPE": mean_absolute_percentage_error(actual_close, predicted_close),
        "direction_accuracy": directional_accuracy(actual_close, predicted_close),
    }


__all__ = [
    "mean_absolute_error",
    "root_mean_squared_error",
    "mean_absolute_percentage_error",
    "directional_accuracy",
    "compute_metrics",
]
