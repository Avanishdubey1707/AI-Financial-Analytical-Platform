from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import pandas as pd

try:
    import yfinance as yf
except Exception:  # pragma: no cover
    yf = None

from config.settings import HISTORICAL_DIR

logger = logging.getLogger(__name__)


class DataLoadError(RuntimeError):
    """Raised when stock data cannot be loaded."""


def _symbol_to_filename(symbol: str) -> str:
    return f"{symbol.replace('.', '_')}.csv"


def ensure_data_dir(symbol: str, base_dir: Path | str = HISTORICAL_DIR) -> Path:
    data_dir = Path(base_dir)
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir


def download_stock_data(symbol: str, save_dir: Path | str = HISTORICAL_DIR, period: str = "5y", interval: str = "1d") -> pd.DataFrame:
    """Download OHLCV data using yfinance and store it locally.

    The dependency is intentionally abstracted so a future provider (NSE, broker API,
    or a paid market data source) can be swapped in without altering the rest of the
    pipeline.
    """
    if yf is None:
        raise DataLoadError("yfinance is not installed. Install dependencies from requirements.txt first.")

    target_dir = ensure_data_dir(symbol, save_dir)
    logger.info("Downloading %s from yfinance", symbol)
    ticker = yf.download(symbol, period=period, interval=interval, auto_adjust=False, progress=False, threads=True)
    if ticker.empty:
        raise DataLoadError(f"No historical data returned for {symbol}.")

    df = ticker.reset_index().rename(columns={
        "Date": "Date",
        "Open": "Open",
        "High": "High",
        "Low": "Low",
        "Close": "Close",
        "Volume": "Volume",
    })
    if "Date" not in df.columns:
        df = df.rename(columns={"Datetime": "Date"})

    df["Date"] = pd.to_datetime(df["Date"])
    df = df[["Date", "Open", "High", "Low", "Close", "Volume"]].copy()
    df.columns = ["Date", "Open", "High", "Low", "Close", "Volume"]

    file_path = target_dir / _symbol_to_filename(symbol)
    df.to_csv(file_path, index=False)
    logger.info("Saved %s historical data to %s", symbol, file_path)
    return df


def load_stock_history(symbol: str, data_dir: Path | str = HISTORICAL_DIR) -> pd.DataFrame:
    """Load a stock's historical data from local storage if present, otherwise download it."""
    target_dir = Path(data_dir)
    file_path = target_dir / _symbol_to_filename(symbol)

    if file_path.exists():
        df = pd.read_csv(file_path)
        df["Date"] = pd.to_datetime(df["Date"])
        return df

    return download_stock_data(symbol=symbol, save_dir=target_dir)


def read_processed_data(symbol: str, processed_dir: Path | str = None) -> pd.DataFrame | None:
    if processed_dir is None:
        processed_dir = Path(HISTORICAL_DIR)
    path = Path(processed_dir) / _symbol_to_filename(symbol)
    if not path.exists():
        return None
    df = pd.read_csv(path)
    df["Date"] = pd.to_datetime(df["Date"])
    return df


__all__ = [
    "DataLoadError",
    "download_stock_data",
    "load_stock_history",
    "read_processed_data",
]
