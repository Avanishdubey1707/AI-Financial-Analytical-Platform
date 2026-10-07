"""
STOCK PRICE PREDICTION
======================
Used by:
    POST /stocks/{symbol}/predictions      -> generate_prediction(...) then store the result in PREDICTIONS

Approach:
    * Technical-indicator features from OHLCV (returns, SMA ratios, MACD, RSI, volatility, volume ratio)
    * RandomForestRegressor predicts the log-return `horizon_days` ahead
    * Time-ordered validation (no shuffling) -> MAE + directional accuracy
    * Price band from validation residuals, confidence = directional accuracy x tree agreement
    * Trained models are cached on disk (joblib) and re-trained every `retrain_after_days`

Input : prices DataFrame / list of dicts with  date, open, high, low, close, volume  (STOCK_PRICES table)
Output: dict ready to be inserted into PREDICTIONS

NOTE: Markets are very noisy. Treat output as a statistical signal, not financial advice.
"""
import os
from datetime import datetime, timedelta

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

MODEL_NAME = "RandomForest_v1"
MIN_ROWS = 150                      # minimum price rows needed to train
DEFAULT_MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")


# ---------------------------------------------------------------- features
def _prepare(prices) -> pd.DataFrame:
    df = pd.DataFrame(prices).copy()
    df.columns = [c.lower() for c in df.columns]
    if "close" not in df.columns and "adj_close" in df.columns:
        df["close"] = df["adj_close"]
    df["date"] = pd.to_datetime(df["date"])
    for c in ("open", "high", "low"):
        if c not in df.columns:
            df[c] = df["close"]
    if "volume" not in df.columns:
        df["volume"] = np.nan
    for c in ("open", "high", "low", "close", "volume"):
        df[c] = pd.to_numeric(df[c], errors="coerce")
    df = df.dropna(subset=["close"]).drop_duplicates("date").sort_values("date").reset_index(drop=True)
    return df


def _rsi(close: pd.Series, n=14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(n).mean()
    loss = (-delta.clip(upper=0)).rolling(n).mean()
    rs = gain / loss.replace(0, np.nan)
    return (100 - 100 / (1 + rs)).fillna(50)


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    c = df["close"]
    f = pd.DataFrame(index=df.index)
    ret1 = np.log(c / c.shift(1))
    for n in (1, 5, 10, 20):
        f[f"ret_{n}"] = np.log(c / c.shift(n))
    for n in (5, 10, 20, 50):
        f[f"sma_ratio_{n}"] = c / c.rolling(n).mean() - 1
    ema12, ema26 = c.ewm(span=12, adjust=False).mean(), c.ewm(span=26, adjust=False).mean()
    macd = ema12 - ema26
    f["macd"] = macd / c
    f["macd_signal_diff"] = (macd - macd.ewm(span=9, adjust=False).mean()) / c
    f["rsi_14"] = _rsi(c)
    f["vol_10"] = ret1.rolling(10).std()
    f["vol_20"] = ret1.rolling(20).std()
    f["hl_range"] = (df["high"] - df["low"]) / c
    if df["volume"].notna().sum() > 30:
        f["volume_ratio"] = (df["volume"] / df["volume"].rolling(20).mean()).replace([np.inf, -np.inf], np.nan).fillna(1.0)
    else:
        f["volume_ratio"] = 1.0
    f["dow"] = df["date"].dt.dayofweek
    return f.replace([np.inf, -np.inf], np.nan)


# ---------------------------------------------------------------- training
def train_model(prices, horizon_days: int = 5) -> dict:
    """Train + validate. Returns a bundle dict (model, metrics, feature_cols, trained_at ...)."""
    df = _prepare(prices)
    if len(df) < MIN_ROWS:
        raise ValueError(f"Need at least {MIN_ROWS} price rows to train, got {len(df)}")
    X_all = build_features(df)
    y_all = np.log(df["close"].shift(-horizon_days) / df["close"])
    data = X_all.assign(_y=y_all).dropna()
    X, y = data.drop(columns="_y"), data["_y"]
    feature_cols = list(X.columns)

    # time-ordered validation split (with a gap of `horizon_days` to avoid label leakage)
    split = int(len(X) * 0.8)
    X_tr, y_tr = X.iloc[: max(split - horizon_days, 1)], y.iloc[: max(split - horizon_days, 1)]
    X_va, y_va = X.iloc[split:], y.iloc[split:]

    params = dict(n_estimators=300, min_samples_leaf=5, max_features=0.5, n_jobs=-1, random_state=42)
    val_model = RandomForestRegressor(**params).fit(X_tr, y_tr)
    pred_va = val_model.predict(X_va)
    resid_std = float(np.std(y_va - pred_va))
    mae = float(np.mean(np.abs(y_va - pred_va)))
    dir_acc = float(np.mean(np.sign(pred_va) == np.sign(y_va)))
    baseline_mae = float(np.mean(np.abs(y_va)))          # "predict no change"

    final_model = RandomForestRegressor(**params).fit(X, y)  # refit on everything
    return {
        "model": final_model,
        "feature_cols": feature_cols,
        "horizon_days": horizon_days,
        "trained_at": datetime.utcnow().isoformat(),
        "n_train_rows": int(len(X)),
        "metrics": {
            "mae_return": round(mae, 5),
            "baseline_mae_return": round(baseline_mae, 5),
            "directional_accuracy": round(dir_acc, 3),
            "residual_std": round(resid_std, 5),
        },
    }


def _model_path(symbol, horizon_days, model_dir):
    os.makedirs(model_dir, exist_ok=True)
    return os.path.join(model_dir, f"{symbol.upper()}_{horizon_days}d.joblib")


# ---------------------------------------------------------------- public API
def generate_prediction(symbol: str, prices, horizon_days: int = 5, model_dir: str = DEFAULT_MODEL_DIR,
                        retrain_after_days: int = 7, force_retrain: bool = False) -> dict:
    """
    Main function for  POST /stocks/{symbol}/predictions

    symbol        : "AAPL"
    prices        : rows from STOCK_PRICES (date, open, high, low, close, volume), oldest->newest or any order
    horizon_days  : how many trading days ahead to predict (e.g. 1, 5, 30)
    """
    df = _prepare(prices)
    path = _model_path(symbol, horizon_days, model_dir)

    bundle = None
    if os.path.exists(path) and not force_retrain:
        saved = joblib.load(path)
        age = datetime.utcnow() - datetime.fromisoformat(saved["trained_at"])
        if age < timedelta(days=retrain_after_days):
            bundle = saved
    if bundle is None:
        bundle = train_model(df, horizon_days)
        joblib.dump(bundle, path)

    feats = build_features(df)[bundle["feature_cols"]].iloc[[-1]]
    if feats.isna().any(axis=None):
        raise ValueError("Not enough recent history to compute indicators for the latest day")

    model = bundle["model"]
    tree_preds = np.array([t.predict(feats.to_numpy())[0] for t in model.estimators_])
    pred_ret = float(tree_preds.mean())
    agreement = float(np.mean(np.sign(tree_preds) == np.sign(pred_ret)))
    m = bundle["metrics"]
    confidence = float(np.clip(m["directional_accuracy"], 0, 1) * agreement)

    last_close = float(df["close"].iloc[-1])
    last_date = df["date"].iloc[-1]
    band = 1.645 * m["residual_std"]                        # ~90% interval
    flat_band = 0.0025 * np.sqrt(horizon_days)
    direction = "UP" if pred_ret > flat_band else "DOWN" if pred_ret < -flat_band else "FLAT"

    return {
        "stock_symbol": symbol.upper(),
        "prediction_date": datetime.utcnow().date().isoformat(),
        "target_date": (last_date + pd.offsets.BDay(horizon_days)).date().isoformat(),
        "horizon_days": horizon_days,
        "current_price": round(last_close, 4),
        "predicted_price": round(last_close * float(np.exp(pred_ret)), 4),
        "predicted_return_pct": round((float(np.exp(pred_ret)) - 1) * 100, 3),
        "lower_price": round(last_close * float(np.exp(pred_ret - band)), 4),
        "upper_price": round(last_close * float(np.exp(pred_ret + band)), 4),
        "direction": direction,
        "confidence": round(confidence, 3),
        "model_used": MODEL_NAME,
        "reliable": bool(m["directional_accuracy"] > 0.52 and m["mae_return"] < m["baseline_mae_return"]),
        "metrics": m,
        "volatility_20d": round(float(feats["vol_20"].iloc[0]), 5),
    }
