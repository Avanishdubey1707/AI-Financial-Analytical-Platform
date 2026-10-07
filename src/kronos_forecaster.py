from __future__ import annotations

import logging
import os
import sys
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from config.settings import LOOKBACK, PREDICTION_HORIZON, SAMPLE_COUNT, SEED, TEMPERATURE, TOP_P
from src.data_validator import validate_ohlcv_dataframe
from src.postprocessor import sanitize_prediction_frame
from src.preprocessing import generate_future_trading_dates, select_recent_window

logger = logging.getLogger(__name__)


class KronosForecastError(RuntimeError):
    """Raised when a Kronos prediction fails."""


def _load_kronos_classes():
    kronos_root = Path(__file__).resolve().parents[1] / "Kronos"
    if not kronos_root.exists():
        raise KronosForecastError(f"Kronos repo not found at {kronos_root}.")

    if str(kronos_root) not in sys.path:
        sys.path.insert(0, str(kronos_root))

    try:
        from model import Kronos, KronosPredictor, KronosTokenizer
        return Kronos, KronosTokenizer, KronosPredictor
    except Exception as exc:  # pragma: no cover - environment may not include the model package
        raise KronosForecastError(f"Could not import Kronos model classes from {kronos_root}: {exc}") from exc


class KronosForecaster:
    def __init__(
        self,
        model_name: str = "NeoQuasar/Kronos-small",
        tokenizer_name: str = "NeoQuasar/Kronos-Tokenizer-base",
        device: str = "cpu",
        lookback: int = LOOKBACK,
        pred_len: int = PREDICTION_HORIZON,
        temperature: float = TEMPERATURE,
        top_p: float = TOP_P,
        sample_count: int = SAMPLE_COUNT,
        seed: int = SEED,
    ) -> None:
        self.model_name = model_name
        self.tokenizer_name = tokenizer_name
        self.device = device
        self.lookback = lookback
        self.pred_len = pred_len
        self.temperature = temperature
        self.top_p = top_p
        self.sample_count = sample_count
        self.seed = seed
        self._model = None
        self._tokenizer = None
        self._predictor = None

    def load(self):
        if self._predictor is not None:
            return self._predictor

        Kronos, KronosTokenizer, KronosPredictor = _load_kronos_classes()
        logger.info("Loading Kronos tokenizer from %s", self.tokenizer_name)
        tokenizer = KronosTokenizer.from_pretrained(self.tokenizer_name)
        tokenizer.eval()

        logger.info("Loading Kronos model from %s", self.model_name)
        model = Kronos.from_pretrained(self.model_name)
        model.eval()

        predictor = KronosPredictor(model, tokenizer, device=self.device, max_context=self.lookback)
        self._tokenizer = tokenizer
        self._model = model
        self._predictor = predictor
        return predictor

    def _generate_prediction_dates(self, df: pd.DataFrame) -> pd.Series:
        latest_date = pd.to_datetime(df["Date"].iloc[-1])
        future_dates = []
        cursor = latest_date + pd.Timedelta(days=1)
        while len(future_dates) < self.pred_len:
            if cursor.weekday() < 5:
                future_dates.append(cursor)
            cursor += pd.Timedelta(days=1)
        return pd.Series(future_dates, name="Date")

    def forecast(self, symbol: str, df: pd.DataFrame) -> dict[str, Any]:
        """Run a forecast for one symbol using the KronosPredictor wrapper."""
        df = validate_ohlcv_dataframe(df, symbol=symbol)
        recent = select_recent_window(df, self.lookback)

        x_df = recent[["Open", "High", "Low", "Close", "Volume"]].reset_index(drop=True)
        x_timestamp = pd.Series(pd.to_datetime(recent["Date"])).reset_index(drop=True)
        y_timestamp = self._generate_prediction_dates(recent)

        predictor = self.load()

        raw_prediction = predictor.predict(
            df=x_df,
            x_timestamp=x_timestamp,
            y_timestamp=y_timestamp,
            pred_len=self.pred_len,
            T=self.temperature,
            top_p=self.top_p,
            sample_count=self.sample_count,
            verbose=False,
        )
        raw_prediction = raw_prediction.reset_index(drop=True)

        validated_prediction, corrections = sanitize_prediction_frame(raw_prediction)
        validated_prediction["Date"] = y_timestamp.values

        return {
            "symbol": symbol,
            "forecast_horizon": self.pred_len,
            "lookback": self.lookback,
            "dates": list(validated_prediction["Date"].dt.strftime("%Y-%m-%d")),
            "raw_prediction": raw_prediction,
            "validated_prediction": validated_prediction,
            "corrections": corrections,
        }


__all__ = ["KronosForecaster", "KronosForecastError"]
