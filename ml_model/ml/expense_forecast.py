"""
EXPENSE FORECASTING
===================
Used by:
    POST /expense-forecasts/generate   -> forecast_expenses(...)      then store rows in EXPENSE_FORECASTS
    GET  /expense-forecasts/summary    -> forecast_vs_actual(...)

Approach (per category, monthly data):
    Candidate models : damped Holt trend, linear trend, weighted moving average, seasonal-naive (needs 24+ months)
    Selection        : rolling-origin back-test on the last months; best two models are averaged
    Uncertainty      : 80% band from the back-test errors
Works with as little as 3 months of history (falls back to a simple average).

Input : transactions [{"type":"expense","amount":1200,"category":"food","date":"2025-01-14"}, ...]
Output: list of {category, month, predicted_amount, lower_bound, upper_bound, model_used}
"""
import numpy as np
import pandas as pd

EXPENSE_TYPES = {"expense", "debit", "withdrawal", "payment", "spend"}
MIN_MONTHS = 3


# ---------------------------------------------------------------- data prep
def monthly_table(transactions, exclude_current_month=True, today=None) -> pd.DataFrame:
    """Rows = months (continuous), columns = categories, values = total spend."""
    df = pd.DataFrame(list(transactions))
    if df.empty:
        return pd.DataFrame()
    if "type" in df.columns:
        df = df[df["type"].astype(str).str.lower().isin(EXPENSE_TYPES)]
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").abs()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    if df["date"].dt.tz is not None:
        df["date"] = df["date"].dt.tz_localize(None)
    df["category"] = df.get("category", "uncategorized")
    df["category"] = df["category"].fillna("uncategorized").astype(str).str.lower()
    df = df.dropna(subset=["amount", "date"])
    if df.empty:
        return pd.DataFrame()
    df["month"] = df["date"].dt.to_period("M")
    table = df.pivot_table(index="month", columns="category", values="amount", aggfunc="sum", fill_value=0.0)
    table = table.reindex(pd.period_range(table.index.min(), table.index.max(), freq="M"), fill_value=0.0)
    if exclude_current_month:
        current = pd.Period(today or pd.Timestamp.today(), freq="M")
        table = table[table.index < current]
    return table


# ---------------------------------------------------------------- candidate models
def _wma(y, h):
    w = np.array([1, 2, 3], dtype=float)[-min(3, len(y)):]
    val = float(np.dot(y[-len(w):], w) / w.sum())
    return np.full(h, val)


def _linear(y, h):
    y = y[-12:]
    x = np.arange(len(y))
    slope, intercept = np.polyfit(x, y, 1)
    return np.array([intercept + slope * (len(y) + i) for i in range(h)])


def _holt(y, h, phi=0.9):
    best = None
    for a in (0.2, 0.4, 0.6, 0.8):
        for b in (0.1, 0.2, 0.4):
            level, trend, sse = y[0], (y[1] - y[0]) if len(y) > 1 else 0.0, 0.0
            for t in range(1, len(y)):
                pred = level + phi * trend
                sse += (y[t] - pred) ** 2
                new_level = a * y[t] + (1 - a) * pred
                trend = b * (new_level - level) + (1 - b) * phi * trend
                level = new_level
            if best is None or sse < best[0]:
                best = (sse, level, trend)
    _, level, trend = best
    return np.array([level + sum(phi ** k for k in range(1, i + 2)) * trend for i in range(h)])


def _seasonal(y, h):
    if len(y) < 24:
        raise ValueError("need 24 months")
    recent, last_year = y[-3:].mean(), y[-15:-12].mean()
    ratio = recent / last_year if last_year > 0 else 1.0
    ratio = float(np.clip(ratio, 0.5, 2.0))
    return np.array([y[len(y) - 12 + (i % 12)] * ratio for i in range(h)])


MODELS = {"holt": _holt, "linear": _linear, "wma": _wma, "seasonal": _seasonal}


# ---------------------------------------------------------------- per-series forecasting
def _forecast_series(y: np.ndarray, h: int):
    """Returns (forecast[h], lower[h], upper[h], model_name)."""
    if len(y) < MIN_MONTHS:
        mean = float(y.mean())
        return np.full(h, mean), np.full(h, mean * 0.8), np.full(h, mean * 1.2), "mean"

    n_back = min(4, len(y) - 3)
    errors = {name: [] for name in MODELS}
    for k in range(n_back):
        cut = len(y) - n_back + k
        train, actual = y[:cut], y[cut]
        for name, fn in MODELS.items():
            try:
                errors[name].append(actual - fn(train, 1)[0])
            except Exception:
                pass
    scored = sorted(((np.mean(np.abs(e)), name) for name, e in errors.items() if len(e) == n_back))
    chosen = [name for _, name in scored[:2]] or ["wma"]
    fc = np.mean([MODELS[m](y, h) for m in chosen], axis=0)
    resid = np.concatenate([np.array(errors[m]) for m in chosen if len(errors[m])] or [np.array([0.0])])
    sigma = float(np.std(resid)) if len(resid) > 1 else float(y.std())
    sigma = max(sigma, 0.05 * float(y.mean()))
    fc = np.clip(fc, 0, None)
    lower = np.clip(fc - 1.28 * sigma, 0, None)
    upper = fc + 1.28 * sigma
    return fc, lower, upper, "ensemble(" + "+".join(chosen) + ")"


# ---------------------------------------------------------------- public API
def forecast_expenses(transactions, months_ahead: int = 3, today=None) -> list:
    """
    Main function for POST /expense-forecasts/generate

    Returns one row per (category, month) plus rows with category == "TOTAL".
    """
    table = monthly_table(transactions, today=today)
    if table.empty:
        return []
    start = table.index[-1] + 1
    future = pd.period_range(start, periods=months_ahead, freq="M")
    rows, totals = [], {"p": np.zeros(months_ahead), "l": np.zeros(months_ahead), "u": np.zeros(months_ahead)}
    for cat in table.columns:
        y = table[cat].to_numpy(dtype=float)
        if y.sum() == 0:
            continue
        fc, lo, up, name = _forecast_series(y, months_ahead)
        totals["p"] += fc; totals["l"] += lo; totals["u"] += up
        for i, m in enumerate(future):
            rows.append({"category": cat, "month": m.start_time.date().isoformat(),
                         "predicted_amount": round(float(fc[i]), 2),
                         "lower_bound": round(float(lo[i]), 2), "upper_bound": round(float(up[i]), 2),
                         "model_used": name})
    for i, m in enumerate(future):
        rows.append({"category": "TOTAL", "month": m.start_time.date().isoformat(),
                     "predicted_amount": round(float(totals["p"][i]), 2),
                     "lower_bound": round(float(totals["l"][i]), 2), "upper_bound": round(float(totals["u"][i]), 2),
                     "model_used": "sum_of_categories"})
    return rows


def forecast_vs_actual(forecast_rows: list, transactions) -> list:
    """
    For GET /expense-forecasts/summary : compare stored forecasts with what the user actually spent.
    forecast_rows: rows from EXPENSE_FORECASTS (category, month, predicted_amount)
    """
    actual = monthly_table(transactions, exclude_current_month=False)
    out = []
    for r in forecast_rows:
        m = pd.Period(r["month"], freq="M")
        cat = r["category"]
        if cat == "TOTAL":
            act = float(actual.loc[m].sum()) if m in actual.index else None
        else:
            act = float(actual.loc[m, cat]) if (m in actual.index and cat in actual.columns) else None
        pred = float(r["predicted_amount"])
        out.append({
            "category": cat, "month": r["month"], "predicted_amount": pred, "actual_amount": act,
            "difference": None if act is None else round(act - pred, 2),
            "difference_pct": None if act is None or pred == 0 else round((act - pred) / pred * 100, 1),
            "status": "pending" if act is None else ("over_budget" if act > pred * 1.1 else "under" if act < pred * 0.9 else "on_track"),
        })
    return out
