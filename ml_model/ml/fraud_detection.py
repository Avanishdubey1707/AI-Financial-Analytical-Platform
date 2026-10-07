"""
FRAUD DETECTION
===============
Used by:
    POST /transactions                     (call after saving the new transaction)
    POST /transactions/{id}/check-fraud    (manual re-check)

Approach (hybrid):
    1. Rule engine   -> explainable red flags (huge amount vs. user's habit, burst of
                        transactions, night-time spend, brand-new category ...)
    2. IsolationForest trained on the USER'S OWN history -> "does this look unusual
                        for this person?" (needs >= MIN_HISTORY_FOR_ML past transactions)
    Final risk_score is 0-100.

Input  : transaction dicts with keys  amount, date, category (optional), type (optional), id (optional)
Output : dict ready to be inserted into FRAUD_ALERTS (risk_score, status, reasons ...)
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

# ---------------------------------------------------------------- settings
MIN_HISTORY_FOR_ML = 20        # below this we use rules only
MAX_HISTORY_ROWS = 1000        # only look at the most recent N transactions
HIGH_RISK = 70                 # risk_score >= 70  -> severity "high"
MEDIUM_RISK = 40               # risk_score >= 40  -> severity "medium" (alert is created)
LARGE_ABSOLUTE_AMOUNT = 100_000  # flat "very large" threshold, in your currency; tune it


# ---------------------------------------------------------------- helpers
_EPOCH = pd.Timestamp("1970-01-01")


def _naive(dates: pd.Series) -> pd.Series:
    """Drop timezone info (keeps the wall-clock time as given) so all maths is timezone-free."""
    try:
        return dates.dt.tz_localize(None) if dates.dt.tz is not None else dates
    except AttributeError:
        return dates


def _epoch_seconds(dates: pd.Series) -> np.ndarray:
    """Seconds since epoch, independent of the datetime unit (ns / us / ms) pandas picked."""
    return ((dates - _EPOCH) // pd.Timedelta(seconds=1)).to_numpy(dtype="int64")


def _to_df(records):
    df = pd.DataFrame(list(records))
    if df.empty:
        return pd.DataFrame(columns=["amount", "date", "category", "type", "id"])
    for col, default in (("category", "uncategorized"), ("type", "expense"), ("id", None)):
        if col not in df.columns:
            df[col] = default
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").abs()
    df["date"] = _naive(pd.to_datetime(df["date"], errors="coerce"))
    df["category"] = df["category"].fillna("uncategorized").astype(str).str.lower()
    df = df.dropna(subset=["amount", "date"]).sort_values("date").reset_index(drop=True)
    return df


def _has_time_info(*frames):
    for f in frames:
        if len(f) and ((f["date"].dt.hour != 0) | (f["date"].dt.minute != 0)).any():
            return True
    return False


def _features(df, ref, has_time, self_in_ref):
    """Numeric features for every row in `df`, using `ref` (past data) for statistics."""
    overall_mean = ref["amount"].mean() if len(ref) else 0.0
    cat_stats = ref.groupby("category")["amount"].agg(["mean", "std", "count"]) if len(ref) else None
    ref_ts = _epoch_seconds(ref["date"]) if len(ref) else np.array([])

    rows = []
    for _, r in df.iterrows():
        amt = float(r["amount"])
        if cat_stats is not None and r["category"] in cat_stats.index and cat_stats.loc[r["category"], "count"] >= 3:
            mean = cat_stats.loc[r["category"], "mean"]
            std = cat_stats.loc[r["category"], "std"]
            cat_count = cat_stats.loc[r["category"], "count"]
        else:
            mean, std = overall_mean, (ref["amount"].std() if len(ref) > 1 else 0.0)
            cat_count = cat_stats.loc[r["category"], "count"] if (cat_stats is not None and r["category"] in cat_stats.index) else 0
        std = np.nan_to_num(std)
        std = max(std, 0.25 * mean, 1.0)
        z = (amt - mean) / std

        ts = int((r["date"] - _EPOCH) // pd.Timedelta(seconds=1))
        velocity = int(((ref_ts > ts - 86400) & (ref_ts <= ts)).sum()) - (1 if self_in_ref else 0)
        hour = r["date"].hour if has_time else 12
        rows.append({
            "log_amount": np.log1p(amt),
            "z_amount": z,
            "velocity_24h": velocity,
            "hour_sin": np.sin(2 * np.pi * hour / 24) if has_time else 0.0,
            "hour_cos": np.cos(2 * np.pi * hour / 24) if has_time else 0.0,
            "dow": r["date"].dayofweek,
            "new_category": 1 if cat_count == 0 else 0,
            "_hour": hour,
            "_amount_vs_mean": amt / mean if mean > 0 else 0.0,
        })
    return pd.DataFrame(rows)


def _rule_score(f, amount, has_time):
    score, reasons = 0, []
    z = f["z_amount"]
    if z >= 4:
        score += 40; reasons.append(f"Amount is extremely high compared to your usual spending (z={z:.1f})")
    elif z >= 3:
        score += 30; reasons.append(f"Amount is much higher than usual for this category (z={z:.1f})")
    elif z >= 2.5:
        score += 15; reasons.append(f"Amount is higher than usual for this category (z={z:.1f})")
    if f["_amount_vs_mean"] >= 10:
        score += 20; reasons.append(f"Amount is {f['_amount_vs_mean']:.0f}x your average for this category")
    if f["new_category"] and amount > 0 and f["z_amount"] > 1:
        score += 15; reasons.append("First transaction ever in this category and the amount is large")
    if f["velocity_24h"] >= 6:
        score += 25; reasons.append(f"{int(f['velocity_24h'])} other transactions in the last 24 hours")
    elif f["velocity_24h"] >= 4:
        score += 12; reasons.append(f"{int(f['velocity_24h'])} other transactions in the last 24 hours")
    if has_time and 0 <= f["_hour"] <= 5 and z >= 1.5:
        score += 10; reasons.append("Large transaction made late at night")
    if amount >= LARGE_ABSOLUTE_AMOUNT:
        score += 25; reasons.append(f"Amount exceeds the absolute limit of {LARGE_ABSOLUTE_AMOUNT:,}")
    return min(score, 100), reasons


# ---------------------------------------------------------------- public API
def score_transaction(new_txn: dict, history: list) -> dict:
    """
    Score ONE transaction against the user's past transactions.

    new_txn : {"id":..., "amount": 5400, "date": "2025-03-04 02:15", "category": "shopping", "type": "expense"}
    history : list of the same kind of dicts (the user's earlier transactions)

    Returns
    -------
    {
      "transaction_id": ..., "risk_score": 0-100, "severity": "low|medium|high",
      "is_flagged": bool, "status": "open" | None,   # -> FRAUD_ALERTS.status
      "reasons": [...], "model_used": "rules" | "rules+isolation_forest"
    }
    """
    new_df = _to_df([new_txn])
    if new_df.empty:
        raise ValueError("new_txn needs a valid 'amount' and 'date'")
    hist = _to_df(history)
    if new_txn.get("id") is not None and len(hist):
        hist = hist[hist["id"] != new_txn.get("id")]
    hist = hist.tail(MAX_HISTORY_ROWS).reset_index(drop=True)

    has_time = _has_time_info(hist, new_df)
    f_new = _features(new_df, hist, has_time, self_in_ref=False).iloc[0]
    rule_score, reasons = _rule_score(f_new, float(new_df.loc[0, "amount"]), has_time)

    iso_score, model_used = 0.0, "rules"
    if len(hist) >= MIN_HISTORY_FOR_ML:
        feat_cols = ["log_amount", "z_amount", "velocity_24h", "hour_sin", "hour_cos", "dow", "new_category"]
        X_hist = _features(hist, hist, has_time, self_in_ref=True)[feat_cols]
        model = IsolationForest(n_estimators=200, contamination="auto", random_state=42).fit(X_hist)
        raw = -model.score_samples(f_new[feat_cols].to_frame().T.astype(float))[0]  # higher = weirder
        iso_score = float(np.clip((raw - 0.50) / 0.20, 0, 1) * 100)
        model_used = "rules+isolation_forest"
        if iso_score >= 60:
            reasons.append("Statistical model: this transaction pattern is unusual for your account")

    risk = float(min(100.0, rule_score + 0.5 * iso_score))
    severity = "high" if risk >= HIGH_RISK else "medium" if risk >= MEDIUM_RISK else "low"
    flagged = risk >= MEDIUM_RISK
    return {
        "transaction_id": new_txn.get("id"),
        "risk_score": round(risk, 1),
        "severity": severity,
        "is_flagged": flagged,
        "status": "open" if flagged else None,
        "reasons": reasons if flagged or reasons else ["No unusual patterns detected"],
        "model_used": model_used,
    }


def scan_history(transactions: list) -> list:
    """Back-fill helper: score every transaction using only the transactions BEFORE it."""
    df = _to_df(transactions)
    out = []
    for i in range(len(df)):
        row = df.iloc[i].to_dict()
        row["date"] = str(row["date"])
        past = df.iloc[:i].assign(date=lambda d: d["date"].astype(str)).to_dict("records")
        out.append(score_transaction(row, past))
    return out
