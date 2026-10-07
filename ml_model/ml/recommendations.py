"""
RECOMMENDATION ENGINE
=====================
Used by:
    POST /recommendations/generate

Combines  (a) the user's HOLDINGS  with  (b) the latest PREDICTIONS  and produces
BUY / SELL / REDUCE / HOLD suggestions with a human-readable reason.

Inputs
    holdings    : [{"stock_symbol": "AAPL", "quantity": 10, "avg_price": 150.0}, ...]
    predictions : {"AAPL": <dict returned by stock_prediction.generate_prediction>, ...}
                  (must contain current_price, predicted_return_pct, confidence, horizon_days)
    risk_profile: "conservative" | "moderate" | "aggressive"
    watchlist   : optional list of symbols the user does not own but wants ideas for

Output: list of dicts -> insert into RECOMMENDATIONS
"""
import math

PROFILES = {
    #                buy edge %, sell edge %, max weight of one stock, min confidence to act
    "conservative": dict(buy=3.0, sell=-1.5, max_weight=0.25, min_conf=0.45, stop_loss=-15),
    "moderate":     dict(buy=2.0, sell=-1.5, max_weight=0.35, min_conf=0.40, stop_loss=-20),
    "aggressive":   dict(buy=1.0, sell=-1.0, max_weight=0.50, min_conf=0.35, stop_loss=-30),
}


def _edge(pred: dict) -> float:
    """Confidence-adjusted expected return (%), scaled so different horizons are comparable."""
    scale = math.sqrt(max(pred.get("horizon_days", 5), 1) / 5)
    conf_factor = 0.5 + float(pred.get("confidence", 0))
    return float(pred["predicted_return_pct"]) * conf_factor / scale


def generate_recommendations(holdings: list, predictions: dict, risk_profile: str = "moderate",
                             watchlist: list = None) -> list:
    p = PROFILES.get(risk_profile, PROFILES["moderate"])
    predictions = {k.upper(): v for k, v in predictions.items()}
    recs = []

    # position values for concentration check
    values = {}
    for h in holdings:
        sym = h["stock_symbol"].upper()
        price = predictions.get(sym, {}).get("current_price", h.get("avg_price", 0))
        values[sym] = values.get(sym, 0) + float(h["quantity"]) * float(price)
    total_value = sum(values.values()) or 1.0

    owned = set()
    for h in holdings:
        sym = h["stock_symbol"].upper()
        owned.add(sym)
        pred = predictions.get(sym)
        weight = values[sym] / total_value
        if not pred:
            recs.append(_rec(sym, "HOLD", 0.0, 0.0, "No recent prediction available for this stock, so no change suggested."))
            continue
        cur, avg = float(pred["current_price"]), float(h["avg_price"])
        pnl = (cur - avg) / avg * 100 if avg else 0.0
        edge, conf, exp_ret = _edge(pred), float(pred["confidence"]), float(pred["predicted_return_pct"])
        horizon = pred.get("horizon_days", 5)
        facts = (f"Model expects {exp_ret:+.1f}% over {horizon} trading days (confidence {conf:.0%}); "
                 f"you hold {weight:.0%} of your portfolio in it with a {pnl:+.1f}% gain/loss.")

        if pnl <= p["stop_loss"] and edge < 0:
            recs.append(_rec(sym, "SELL", conf, exp_ret, f"Position is down {pnl:.1f}% and the model still expects a decline. Consider cutting the loss. " + facts))
        elif edge <= p["sell"] and conf >= p["min_conf"]:
            why = "Consider locking in gains" if pnl > 0 else "Consider limiting further losses"
            recs.append(_rec(sym, "SELL", conf, exp_ret, f"Model signals downside. {why}. " + facts))
        elif weight > p["max_weight"]:
            recs.append(_rec(sym, "REDUCE", max(conf, 0.5), exp_ret, f"This stock is {weight:.0%} of your portfolio (limit for a {risk_profile} profile is {p['max_weight']:.0%}). Consider trimming to diversify. " + facts))
        elif edge >= p["buy"] and conf >= p["min_conf"]:
            recs.append(_rec(sym, "BUY", conf, exp_ret, f"Model signals upside and the position size is still within limits - consider adding. " + facts))
        else:
            recs.append(_rec(sym, "HOLD", conf, exp_ret, "No strong signal either way. " + facts))

    # ideas for stocks the user does not own
    for sym in (s.upper() for s in (watchlist or [])):
        if sym in owned or sym not in predictions:
            continue
        pred = predictions[sym]
        if _edge(pred) >= p["buy"] and float(pred["confidence"]) >= p["min_conf"]:
            recs.append(_rec(sym, "BUY", float(pred["confidence"]), float(pred["predicted_return_pct"]),
                             f"Watchlist idea: model expects {pred['predicted_return_pct']:+.1f}% over {pred.get('horizon_days', 5)} trading days "
                             f"(confidence {float(pred['confidence']):.0%}). You do not own it yet."))

    order = {"SELL": 0, "REDUCE": 1, "BUY": 2, "HOLD": 3}
    return sorted(recs, key=lambda r: (order[r["action"]], -r["confidence"]))


def _rec(symbol, action, confidence, exp_ret, reasoning):
    return {
        "stock_symbol": symbol,
        "action": action,
        "confidence": round(confidence, 3),
        "expected_return_pct": round(exp_ret, 3),
        "reasoning": reasoning,
    }
