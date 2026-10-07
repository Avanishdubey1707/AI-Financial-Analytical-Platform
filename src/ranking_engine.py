from __future__ import annotations

from typing import Any


def score_stock(stock_result: dict[str, Any]) -> float:
    expected_return = float(stock_result.get("expected_return_pct", 0.0))
    risk = float(stock_result.get("risk_score", 0.5))
    trend_strength = float(stock_result.get("trend_strength", 0.5))
    reliability = float(stock_result.get("model_reliability", 0.5))
    signal_strength = float(stock_result.get("signal_strength", 50.0))

    return_score = max(0.0, expected_return / 10.0)
    risk_penalty = risk * 2.5
    trend_score = trend_strength * 1.5
    reliability_score = reliability * 1.2
    signal_bonus = signal_strength / 100.0

    return return_score + reliability_score + trend_score + signal_bonus - risk_penalty


def rank_stocks(stocks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    scored = []
    for stock in stocks:
        stock_copy = dict(stock)
        stock_copy["score"] = score_stock(stock)
        scored.append(stock_copy)
    scored.sort(key=lambda item: item["score"], reverse=True)
    for rank, stock in enumerate(scored, start=1):
        stock["rank"] = rank
    return scored


__all__ = ["score_stock", "rank_stocks"]
