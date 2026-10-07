from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ForecastEntry(BaseModel):
    day: int
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float


class PredictionResponse(BaseModel):
    symbol: str
    current_price: float
    forecast_horizon: int = 10
    predictions: list[ForecastEntry]
    predicted_close_t1: float
    predicted_close_t5: float
    predicted_close_t10: float
    expected_return_pct: float
    direction: str
    trend: str
    risk: str
    signal_strength: float
    model_name: str = "Kronos-small"
    model_version: str = "1.0"
    forecast_start_date: str | None = None
    forecast_end_date: str | None = None


class Top10StockResponse(BaseModel):
    rank: int
    symbol: str
    expected_return_pct: float
    direction: str
    risk: str
    signal_strength: float


class Top10Response(BaseModel):
    market_regime: str
    generated_at: str
    stocks: list[Top10StockResponse]


__all__ = [
    "ForecastEntry",
    "PredictionResponse",
    "Top10StockResponse",
    "Top10Response",
]
