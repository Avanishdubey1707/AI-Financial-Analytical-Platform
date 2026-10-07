# ML service for a Node.js backend

Architecture:  React  ->  Node/Express (DB, auth)  ->  Python ML service (this folder, localhost:8000)

## 1. Start the Python service
    pip install -r requirements.txt
    uvicorn ml_service:app --host 127.0.0.1 --port 8000
Optional: set ML_API_KEY (same value in the Node env) so only your backend can call it.

## 2. Use it from Node (Node 18+)
Copy node/mlClient.js into your project. Set ML_SERVICE_URL (default http://127.0.0.1:8000) and ML_API_KEY.
node/exampleRoutes.js shows all 5 routes; replace the db.* calls with your own queries.

## Endpoints of the Python service
POST /ml/fraud/score        {transaction, history}
POST /ml/stocks/predict     {symbol, prices, horizon_days}
POST /ml/recommendations    {holdings, predictions, risk_profile, watchlist}
POST /ml/expenses/forecast  {transactions, months_ahead}
POST /ml/expenses/summary   {forecasts, transactions}
GET  /health

Never expose this service to the public internet; only your Node backend should reach it.

## ES modules (import/export) projects
If your package.json contains  "type": "module",  change the client's last block to
`export const scoreFraud = ...` (one export per function) and use `import * as ml from "./mlClient.js"`.

## Error handling in controllers
- `err.status === 422`      -> bad input / not enough data (message is safe to show)
- `err.code === "ML_UNAVAILABLE"` -> service down or timed out (return 503)
