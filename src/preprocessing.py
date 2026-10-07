from __future__ import annotations

from typing import Iterable

import numpy as np
import pandas as pd


def compute_daily_returns(series: pd.Series) -> pd.Series:
    return series.pct_change().fillna(0.0)


def select_recent_window(df: pd.DataFrame, lookback: int) -> pd.DataFrame:
    if len(df) < lookback:
        raise ValueError(f"Required at least {lookback} rows, found {len(df)}.")
    window = df.tail(lookback).copy().reset_index(drop=True)
    return window


def generate_future_trading_dates(last_date: pd.Timestamp, horizon: int, historical_dates: Iterable[pd.Timestamp]) -> pd.Series:
    """Generate the next trading dates using the observed market calendar.

    This avoids assuming a generic weekday-only calendar and instead uses actual
    historical market dates to infer the real trading rhythm for the symbol.
    """
    unique_dates = sorted(set(pd.to_datetime(list(historical_dates))))
    recent = pd.Series(unique_dates)
    next_dates = []
    cursor = pd.Timestamp(last_date)
    while len(next_dates) < horizon:
        cursor = cursor + pd.Timedelta(days=1)
        if cursor.weekday() < 5 and cursor in set(unique_dates):
            next_dates.append(cursor)
        elif cursor.weekday() < 5:
            # The market calendar is inferred from the historical dates rather than a
            # hard-coded exchange holiday calendar. If a date is not present, we keep
            # walking until the next actual observed market date appears.
            if cursor not in set(unique_dates):
                continue
            next_dates.append(cursor)
    return pd.Series(next_dates[:horizon], name="Date")


def make_model_frames(df: pd.DataFrame, historical_dates: pd.Series) -> tuple[pd.DataFrame, pd.Series]:
    x_df = df[["Open", "High", "Low", "Close", "Volume"]].reset_index(drop=True)
    x_timestamp = pd.Series(pd.to_datetime(df["Date"])).reset_index(drop=True)
    future_dates = generate_future_trading_dates(df["Date"].iloc[-1], len(x_df), historical_dates)
    return x_df, x_timestamp, future_dates


def compute_summary_statistics(df: pd.DataFrame) -> dict[str, float]:
    closes = df["Close"].astype(float)
    returns = compute_daily_returns(closes)
    return {
        "last_close": float(closes.iloc[-1]),
        "avg_return": float(returns.mean()),
        "volatility": float(returns.std() * np.sqrt(252)),
        "max_drawdown": float((closes / closes.cummax() - 1).min()),
        "recent_return_20d": float((closes.iloc[-1] / closes.iloc[-20] - 1) * 100) if len(closes) >= 20 else 0.0,
    }


__all__ = [
    "compute_daily_returns",
    "select_recent_window",
    "generate_future_trading_dates",
    "make_model_frames",
    "compute_summary_statistics",
]
