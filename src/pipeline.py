from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd

from config.settings import BACKTEST_DIR, DIRECTION_THRESHOLD, LOOKBACK, PREDICTION_HORIZON, PREDICTIONS_DIR, RESULTS_DIR, ensure_directories, get_stock_universe
from src.data_loader import load_stock_history
from src.data_validator import validate_ohlcv_dataframe
from src.kronos_forecaster import KronosForecaster, KronosForecastError
from src.postprocessor import sanitize_prediction_frame
from src.preprocessing import compute_daily_returns, compute_summary_statistics
from src.regime_detector import detect_market_regime
from src.risk_engine import calculate_risk
from src.ranking_engine import rank_stocks

logger = logging.getLogger(__name__)


def _direction_from_return(value: float, threshold: float = DIRECTION_THRESHOLD) -> str:
    if value > threshold:
        return "UP"
    if value < -threshold:
        return "DOWN"
    return "NEUTRAL"


def _trend_from_forecast(forecast: pd.DataFrame) -> tuple[str, float]:
    closes = pd.to_numeric(forecast["Close"], errors="coerce").dropna()
    if closes.empty:
        return "SIDEWAYS", 0.0
    pct_change = closes.pct_change().dropna()
    slope = float(pct_change.mean()) * 100.0 if not pct_change.empty else 0.0
    total_return = float((closes.iloc[-1] / closes.iloc[0] - 1) * 100.0) if len(closes) > 1 else 0.0
    if total_return > 2.0 and slope > 0.1:
        return "BULLISH", total_return
    if total_return < -2.0 and slope < -0.1:
        return "BEARISH", total_return
    return "SIDEWAYS", total_return


class StockPipeline:
    def __init__(self, forecast_horizon: int = PREDICTION_HORIZON, lookback: int = LOOKBACK) -> None:
        self.forecast_horizon = forecast_horizon
        self.lookback = lookback
        self.forecaster = KronosForecaster(pred_len=forecast_horizon, lookback=lookback)

    def run_single_stock(self, symbol: str, stock_name: str | None = None) -> dict[str, Any]:
        try:
            df = load_stock_history(symbol)
            df = validate_ohlcv_dataframe(df, symbol=symbol)
            forecast_bundle = self.forecaster.forecast(symbol=symbol, df=df)
            forecast_df = forecast_bundle["validated_prediction"]
            raw_prediction = forecast_bundle["raw_prediction"]
            risk = calculate_risk(df, forecast_df)
            summary = compute_summary_statistics(df)
            expected_return_pct = ((forecast_df["Close"].iloc[-1] - summary["last_close"]) / summary["last_close"]) * 100.0
            direction = _direction_from_return(expected_return_pct)
            trend, trend_strength = _trend_from_forecast(forecast_df)
            signal_strength = min(100.0, max(0.0, 50 + (expected_return_pct * 3.0) + (trend_strength * 2.0) - (risk["risk_score"] * 40)))
            model_reliability = 0.65 if len(df) >= 300 else 0.5
            result = {
                "symbol": symbol,
                "name": stock_name or symbol,
                "current_price": float(summary["last_close"]),
                "forecast_horizon": self.forecast_horizon,
                "forecast": [
                    {
                        "day": idx + 1,
                        "date": row["Date"].strftime("%Y-%m-%d") if hasattr(row["Date"], "strftime") else str(row["Date"]),
                        "open": float(row["Open"]),
                        "high": float(row["High"]),
                        "low": float(row["Low"]),
                        "close": float(row["Close"]),
                        "volume": float(row["Volume"]),
                    }
                    for idx, row in forecast_df.iterrows()
                ],
                "predicted_close_t1": float(forecast_df["Close"].iloc[0]),
                "predicted_close_t5": float(forecast_df["Close"].iloc[4]),
                "predicted_close_t10": float(forecast_df["Close"].iloc[-1]),
                "expected_return_pct": float(expected_return_pct),
                "direction": direction,
                "trend": trend,
                "risk": risk["risk"],
                "risk_score": risk["risk_score"],
                "trend_strength": trend_strength,
                "signal_strength": float(signal_strength),
                "model_reliability": model_reliability,
                "raw_prediction": raw_prediction,
                "validated_prediction": forecast_df,
                "corrections": forecast_bundle.get("corrections", []),
            }
            return result
        except Exception as exc:  # pragma: no cover - expected for stock-specific failures
            logger.exception("Failed to process %s", symbol)
            return {
                "symbol": symbol,
                "status": "FAILED",
                "error": str(exc),
            }

    def run_top10(self) -> dict[str, Any]:
        ensure_directories()
        universe = get_stock_universe()
        results = []
        failed = []
        for stock in universe:
            symbol = stock["symbol"]
            result = self.run_single_stock(symbol, stock.get("name"))
            if result.get("status") == "FAILED":
                failed.append({"symbol": symbol, "status": "FAILED", "error": result.get("error", "Unknown error")})
                continue
            results.append(result)

        market_regime = detect_market_regime(pd.concat([load_stock_history(stock["symbol"]).pipe(validate_ohlcv_dataframe, symbol=stock["symbol"]) for stock in universe], ignore_index=True))
        ranked = rank_stocks(results)
        top10 = {
            "market_regime": str(market_regime["regime"]),
            "generated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "stocks": [
                {
                    "rank": item["rank"],
                    "symbol": item["symbol"],
                    "expected_return_pct": float(item.get("expected_return_pct", 0.0)),
                    "direction": item.get("direction", "NEUTRAL"),
                    "risk": item.get("risk", "MEDIUM"),
                    "signal_strength": float(item.get("signal_strength", 0.0)),
                }
                for item in ranked
            ],
        }

        predictions_csv = pd.DataFrame([
            {
                "symbol": item["symbol"],
                "current_price": item["current_price"],
                "predicted_close_t10": item["predicted_close_t10"],
                "expected_return_pct": item["expected_return_pct"],
                "direction": item["direction"],
                "risk": item["risk"],
                "signal_strength": item["signal_strength"],
            }
            for item in results
        ])
        predictions_path = PREDICTIONS_DIR / "latest_predictions.csv"
        predictions_csv.to_csv(predictions_path, index=False)

        summary_path = RESULTS_DIR / "summary.csv"
        summary_df = pd.DataFrame([
            {
                "symbol": item["symbol"],
                "current_price": item["current_price"],
                "expected_return_pct": item["expected_return_pct"],
                "direction": item["direction"],
                "risk": item["risk"],
                "signal_strength": item["signal_strength"],
                "trend": item["trend"],
            }
            for item in results
        ])
        summary_df.to_csv(summary_path, index=False)

        json_path = PREDICTIONS_DIR / "latest_predictions.json"
        with json_path.open("w", encoding="utf-8") as fh:
            json.dump({
                "generated_at": top10["generated_at"],
                "market_regime": top10["market_regime"],
                "successful_stocks": [item["symbol"] for item in results],
                "failed_stocks": [item["symbol"] for item in failed],
                "stocks": results,
            }, fh, indent=2, default=str)

        return {
            "market_regime": top10["market_regime"],
            "generated_at": top10["generated_at"],
            "successful_stocks": [item["symbol"] for item in results],
            "failed_stocks": [item["symbol"] for item in failed],
            "stocks": top10["stocks"],
            "results": results,
        }


__all__ = ["StockPipeline", "_direction_from_return", "_trend_from_forecast"]
