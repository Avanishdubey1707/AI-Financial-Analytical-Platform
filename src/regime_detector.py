from __future__ import annotations

import numpy as np
import pandas as pd


def detect_market_regime(history: pd.DataFrame) -> dict[str, float | str]:
    """Classify the market state using simple, explainable inputs.

    Inputs include trend via moving averages, returns, volatility, and drawdown.
    """
    closes = pd.to_numeric(history["Close"], errors="coerce").dropna()
    returns = closes.pct_change().dropna()

    if len(closes) < 20:
        return {"regime": "SIDEWAYS", "explanation": "Insufficient history for a reliable market regime classification."}

    sma_10 = closes.rolling(10).mean().iloc[-1]
    sma_20 = closes.rolling(20).mean().iloc[-1]
    recent_return = (closes.iloc[-1] / closes.iloc[-10] - 1) * 100 if len(closes) >= 10 else 0.0
    volatility = returns.std() * np.sqrt(252)
    drawdown = float((closes / closes.cummax() - 1).min())

    if volatility > 0.6 or abs(recent_return) > 12:
        regime = "HIGH_VOLATILITY"
    elif sma_10 > sma_20 and recent_return > 1.5:
        regime = "BULLISH"
    elif sma_10 < sma_20 and recent_return < -1.5:
        regime = "BEARISH"
    else:
        regime = "SIDEWAYS"

    return {
        "regime": regime,
        "sma_10": float(sma_10),
        "sma_20": float(sma_20),
        "recent_return_pct": float(recent_return),
        "volatility": float(volatility),
        "drawdown_pct": float(drawdown * 100),
        "explanation": (
            f"Fast MA {sma_10:.2f} vs slow MA {sma_20:.2f}; recent return {recent_return:.2f}% and volatility {volatility:.3f}."
        ),
    }


__all__ = ["detect_market_regime"]
