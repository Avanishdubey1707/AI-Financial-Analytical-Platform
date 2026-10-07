from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd


def _safe_percent(x: float) -> float:
    return float(x) if np.isfinite(x) else 0.0


def calculate_risk(history: pd.DataFrame, forecast: pd.DataFrame | None = None) -> dict[str, Any]:
    """Compute a transparent risk score using historical volatility and drawdown.

    This does not claim certainty; it is a decision-support signal based on analytical
    features available from the data.
    """
    closes = pd.to_numeric(history["Close"], errors="coerce").dropna()
    returns = closes.pct_change().dropna()

    hist_vol = returns.std() * np.sqrt(252)
    recent_vol = returns.tail(min(20, len(returns))).std() * np.sqrt(252)
    max_drawdown = float((closes / closes.cummax() - 1).min())

    if forecast is not None and not forecast.empty:
        forecast_close = pd.to_numeric(forecast["Close"], errors="coerce").dropna()
        forecast_dispersion = float(forecast_close.std()) / max(float(forecast_close.mean()), 1e-6)
    else:
        forecast_dispersion = 0.0

    score = (
        min(max(_safe_percent(hist_vol / 0.6), 0.0), 1.0) * 0.35
        + min(max(_safe_percent(recent_vol / 0.8), 0.0), 1.0) * 0.25
        + min(max(_safe_percent(abs(max_drawdown) / 0.35), 0.0), 1.0) * 0.25
        + min(max(forecast_dispersion / 0.15, 0.0), 1.0) * 0.15
    )

    if score < 0.33:
        level = "LOW"
    elif score < 0.66:
        level = "MEDIUM"
    else:
        level = "HIGH"

    return {
        "risk_score": float(score),
        "risk": level,
        "historical_volatility": float(hist_vol),
        "recent_volatility": float(recent_vol),
        "max_drawdown": float(max_drawdown),
        "forecast_dispersion": float(forecast_dispersion),
    }


__all__ = ["calculate_risk"]
