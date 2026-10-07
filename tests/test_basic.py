from __future__ import annotations

import pandas as pd
import pytest

from src.data_validator import validate_ohlcv_dataframe
from src.pipeline import _direction_from_return, _trend_from_forecast
from src.ranking_engine import score_stock
from src.risk_engine import calculate_risk


def _make_valid_df() -> pd.DataFrame:
    dates = pd.date_range("2020-01-01", periods=30, freq="D")
    close = [100.0 + i * 0.5 for i in range(30)]
    open_ = [value - 0.5 for value in close]
    high = [value + 1.0 for value in close]
    low = [value - 1.0 for value in close]
    volume = [1000 + i * 10 for i in range(30)]
    return pd.DataFrame({
        "Date": dates,
        "Open": open_,
        "High": high,
        "Low": low,
        "Close": close,
        "Volume": volume,
    })


def test_validate_ohlcv_dataframe_accepts_valid_data() -> None:
    df = _make_valid_df()
    validated = validate_ohlcv_dataframe(df, symbol="TEST.NS")
    assert list(validated.columns) == ["Date", "Open", "High", "Low", "Close", "Volume"]
    assert len(validated) == 30


def test_validate_ohlcv_dataframe_rejects_invalid_ohlc() -> None:
    df = _make_valid_df().copy()
    df.loc[0, "High"] = 10.0
    df.loc[0, "Low"] = 200.0
    with pytest.raises(ValueError):
        validate_ohlcv_dataframe(df, symbol="TEST.NS")


def test_direction_calculation() -> None:
    assert _direction_from_return(2.5) == "UP"
    assert _direction_from_return(-2.5) == "DOWN"
    assert _direction_from_return(0.5) == "NEUTRAL"


def test_trend_classification() -> None:
    forecast = pd.DataFrame({
        "Close": [100.0, 101.0, 102.0, 103.5, 104.2, 105.0],
        "Open": [99.0, 100.0, 101.2, 102.2, 103.0, 104.0],
        "High": [101.5, 102.2, 103.0, 104.5, 105.0, 106.0],
        "Low": [98.0, 99.0, 100.0, 101.8, 102.7, 103.5],
        "Volume": [1000, 1100, 1200, 1300, 1400, 1500],
    })
    trend, strength = _trend_from_forecast(forecast)
    assert trend == "BULLISH"
    assert strength > 0


def test_risk_engine() -> None:
    risk = calculate_risk(_make_valid_df())
    assert risk["risk"] in {"LOW", "MEDIUM", "HIGH"}
    assert risk["risk_score"] >= 0.0


def test_score_stock_is_numeric() -> None:
    result = {"expected_return_pct": 5.0, "risk_score": 0.4, "trend_strength": 0.6, "model_reliability": 0.8, "signal_strength": 70.0}
    assert score_stock(result) >= -10
