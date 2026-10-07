"""
STATELESS ML SERVICE for a Node.js backend
------------------------------------------
Node fetches data from YOUR database and POSTs it here; this service never touches the DB.
Run:  uvicorn ml_service:app --host 127.0.0.1 --port 8000
Keep it on a private network / localhost and (optionally) protect it with ML_API_KEY.
"""
import os
from typing import Any, Dict, List, Optional
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from pydantic import BaseModel, Field

from ml.fraud_detection import score_transaction
from ml.stock_prediction import generate_prediction
from ml.recommendations import generate_recommendations
from ml.expense_forecast import forecast_expenses, forecast_vs_actual

API_KEY = os.getenv("ML_API_KEY")  # if set, Node must send header  x-api-key


def check_key(
    request: Request,
    x_api_key: Optional[str] = Header(default=None)
):
    # Allow health check without API key
    if request.url.path == "/health":
        return

    # Protect everything else
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )


app = FastAPI(title="AI Financial Analytics - ML service", dependencies=[Depends(check_key)])


class FraudIn(BaseModel):
    transaction: Dict[str, Any]
    history: List[Dict[str, Any]] = []


class StockIn(BaseModel):
    symbol: str
    prices: List[Dict[str, Any]]
    horizon_days: int = Field(5, ge=1, le=60)
    force_retrain: bool = False


class RecIn(BaseModel):
    holdings: List[Dict[str, Any]]
    predictions: Dict[str, Dict[str, Any]]
    risk_profile: str = "moderate"
    watchlist: List[str] = []


class ForecastIn(BaseModel):
    transactions: List[Dict[str, Any]]
    months_ahead: int = Field(3, ge=1, le=12)


class SummaryIn(BaseModel):
    forecasts: List[Dict[str, Any]]
    transactions: List[Dict[str, Any]]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ml/fraud/score")
def fraud(body: FraudIn):
    try:
        return score_transaction(body.transaction, body.history)
    except ValueError as e:
        raise HTTPException(422, str(e))


@app.post("/ml/stocks/predict")
def predict(body: StockIn):
    try:
        return generate_prediction(body.symbol, body.prices, body.horizon_days, force_retrain=body.force_retrain)
    except ValueError as e:
        raise HTTPException(422, str(e))


@app.post("/ml/recommendations")
def recommend(body: RecIn):
    return generate_recommendations(body.holdings, body.predictions, body.risk_profile, body.watchlist)


@app.post("/ml/expenses/forecast")
def forecast(body: ForecastIn):
    rows = forecast_expenses(body.transactions, body.months_ahead)
    if not rows:
        raise HTTPException(422, "Not enough expense history to forecast")
    return rows


@app.post("/ml/expenses/summary")
def summary(body: SummaryIn):
    return forecast_vs_actual(body.forecasts, body.transactions)
