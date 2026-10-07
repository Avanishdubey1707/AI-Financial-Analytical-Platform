from __future__ import annotations

from pathlib import Path
import json
from typing import Any

BASE_DIR = Path(__file__).resolve().parents[1]
CONFIG_DIR = BASE_DIR / "config"
DATA_DIR = BASE_DIR / "data"
HISTORICAL_DIR = DATA_DIR / "historical"
PROCESSED_DIR = DATA_DIR / "processed"
PREDICTIONS_DIR = BASE_DIR / "predictions"
BACKTEST_DIR = BASE_DIR / "backtesting"
RESULTS_DIR = BACKTEST_DIR / "results"
REPORTS_DIR = BACKTEST_DIR / "reports"
MODELS_DIR = BASE_DIR / "models"
LOG_DIR = BASE_DIR / "logs"

LOOKBACK = 400
PREDICTION_HORIZON = 10
TEMPERATURE = 1.0
TOP_P = 0.9
SAMPLE_COUNT = 1
DIRECTION_THRESHOLD = 1.5
SEED = 42


def get_stock_universe() -> list[dict[str, str]]:
    config_path = CONFIG_DIR / "stocks.json"
    with config_path.open("r", encoding="utf-8") as fh:
        payload = json.load(fh)
    stocks = payload.get("stocks", [])
    if len(stocks) != 10:
        raise ValueError(f"Expected exactly 10 configured stocks, found {len(stocks)} in {config_path}.")
    return stocks


def ensure_directories() -> None:
    for path in [
        HISTORICAL_DIR,
        PROCESSED_DIR,
        PREDICTIONS_DIR,
        RESULTS_DIR,
        REPORTS_DIR,
        MODELS_DIR,
        LOG_DIR,
    ]:
        path.mkdir(parents=True, exist_ok=True)


__all__ = [
    "BASE_DIR",
    "CONFIG_DIR",
    "DATA_DIR",
    "HISTORICAL_DIR",
    "PROCESSED_DIR",
    "PREDICTIONS_DIR",
    "BACKTEST_DIR",
    "RESULTS_DIR",
    "REPORTS_DIR",
    "MODELS_DIR",
    "LOG_DIR",
    "LOOKBACK",
    "PREDICTION_HORIZON",
    "TEMPERATURE",
    "TOP_P",
    "SAMPLE_COUNT",
    "DIRECTION_THRESHOLD",
    "SEED",
    "get_stock_universe",
    "ensure_directories",
]
