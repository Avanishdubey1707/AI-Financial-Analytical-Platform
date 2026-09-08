# AI Financial Analytics — API Endpoint Structure

Based on the ERD, the system has 8 functional modules built around 12 entities: Users, Auth_Tokens, Portfolios, Holdings, Transactions, Fraud_Alerts, Stocks, Stock_Prices, Predictions, Recommendations, Expense_Forecasts, Reports.

Base URL suggestion: `/api/v1`

---

## 1. Auth & User Management
*Entities: USERS, AUTH_TOKENS*

| Method | Endpoint | Description |
|---|---|---|
| POST | `/users/register` | Create a new user account (name, email, password → hashed and stored) |
| POST | `/users/login` | Validate credentials, issue an auth token (row in AUTH_TOKENS with expiry) |
| POST | `/users/logout` | Invalidate/delete the current auth token |
| POST | `/users/refresh` | Issue a new token before the old one expires |
| GET | `/users/me` | Get the logged-in user's profile |
| PUT | `/users/me` | Update profile (name, email) |
| PUT | `/users/me/password` | Change password |
| DELETE | `/users/me` | Delete account (cascades to portfolios, transactions, etc.) |

---

## 2. Portfolios & Holdings
*Entities: PORTFOLIOS, HOLDINGS, STOCKS*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/portfolios` | List all portfolios owned by the logged-in user |
| POST | `/portfolios` | Create a new portfolio (name) |
| GET | `/portfolios/{id}` | Get a single portfolio's details |
| PUT | `/portfolios/{id}` | Rename/update a portfolio |
| DELETE | `/portfolios/{id}` | Delete a portfolio (and its holdings) |
| GET | `/portfolios/{id}/holdings` | List all stock holdings inside a portfolio |
| POST | `/portfolios/{id}/holdings` | Add a holding (stock_symbol, quantity, avg_price) |
| PUT | `/portfolios/{id}/holdings/{holdingId}` | Update quantity/avg_price of a holding |
| DELETE | `/portfolios/{id}/holdings/{holdingId}` | Remove a holding from a portfolio |
| GET | `/portfolios/{id}/value` | Computed: current market value of the portfolio (holdings × latest stock price) |
| GET | `/portfolios/{id}/performance` | Computed: gain/loss over time for the portfolio |

---

## 3. Transactions & Fraud Detection
*Entities: TRANSACTIONS, FRAUD_ALERTS*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/transactions` | List the logged-in user's transactions (supports filters: date range, category, type) |
| POST | `/transactions` | Create a new transaction (type, amount, category, date, description) — triggers fraud check |
| GET | `/transactions/{id}` | Get a single transaction |
| PUT | `/transactions/{id}` | Update a transaction |
| DELETE | `/transactions/{id}` | Delete a transaction |
| GET | `/transactions/summary` | Aggregated totals by category/month for the user |
| GET | `/fraud-alerts` | List fraud alerts for the logged-in user's transactions |
| GET | `/fraud-alerts/{id}` | Get details of a specific fraud alert (risk_score, status) |
| PUT | `/fraud-alerts/{id}/status` | Update alert status (e.g., reviewed, confirmed, dismissed) |
| POST | `/transactions/{id}/check-fraud` | Manually (re-)trigger fraud scoring on a transaction (internal/admin use) |

---

## 4. Stocks & Market Data
*Entities: STOCKS, STOCK_PRICES*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stocks` | List/search available stocks (filter by sector, exchange, name) |
| GET | `/stocks/{symbol}` | Get details of one stock |
| GET | `/stocks/{symbol}/prices` | Get historical OHLCV price data (query params: from, to, interval) |
| GET | `/stocks/{symbol}/prices/latest` | Get the most recent price snapshot |
| POST | `/stocks/{symbol}/prices` | Ingest a new price record (internal/admin — used by data pipeline) |
| GET | `/stocks/{symbol}/chart` | Formatted time-series data ready for charting |

---

## 5. AI Predictions
*Entity: PREDICTIONS*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stocks/{symbol}/predictions` | Get all predictions for a stock (optionally filter by model_used) |
| POST | `/stocks/{symbol}/predictions` | Trigger the ML model to generate a new prediction and store it |
| GET | `/predictions/{id}` | Get a single prediction's detail |
| GET | `/predictions/latest` | Get the latest predictions across all/watchlisted stocks |

---

## 6. Recommendations
*Entity: RECOMMENDATIONS*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/recommendations` | List recommendations generated for the logged-in user |
| POST | `/recommendations/generate` | Trigger the recommendation engine to produce new suggestions (based on portfolio + predictions) |
| GET | `/recommendations/{id}` | Get a single recommendation and its reasoning |
| DELETE | `/recommendations/{id}` | Dismiss a recommendation |

---

## 7. Expense Forecasting
*Entity: EXPENSE_FORECASTS*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/expense-forecasts` | List forecasts for the logged-in user (filter by month/category) |
| POST | `/expense-forecasts/generate` | Run the forecasting model on the user's transaction history and store results |
| GET | `/expense-forecasts/{id}` | Get a single forecast entry |
| GET | `/expense-forecasts/summary` | Forecast vs. actual spend comparison, by category |

---

## 8. Reports
*Entity: REPORTS*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/reports` | List all reports generated for the user |
| POST | `/reports/generate` | Generate a new report (type: portfolio_summary, tax, expense, fraud, etc.) → produces file_url |
| GET | `/reports/{id}` | Get report metadata |
| GET | `/reports/{id}/download` | Download/stream the actual report file |
| DELETE | `/reports/{id}` | Delete a report |

---

## Relationship-Driven Design Notes

- **USERS is the root entity.** Every other module except STOCKS/STOCK_PRICES/PREDICTIONS is scoped to `user_id`, so most endpoints above should be implemented as "current user's resources" (derived from the auth token) rather than accepting a raw user ID from the client — this avoids one user querying another's data.
- **STOCKS/STOCK_PRICES are shared/global data**, not user-owned — these are read-heavy public endpoints, with write endpoints (`POST /stocks/{symbol}/prices`) reserved for an internal ingestion service or admin role.
- **TRANSACTIONS → FRAUD_ALERTS is 0..1**, meaning fraud checking should be async/event-driven: creating a transaction can enqueue a fraud-scoring job rather than blocking the response.
- **HOLDINGS is a join entity** between PORTFOLIOS and STOCKS — its endpoints are nested under `/portfolios/{id}/holdings` since holdings never exist independently of a portfolio.
- **PREDICTIONS and RECOMMENDATIONS both reference STOCKS**, and RECOMMENDATIONS additionally reference USERS — this is the natural place for the "AI" layer: recommendations should be generated by combining prediction outputs with a user's existing holdings.
- **Suggested auth pattern:** all endpoints except `/auth/register`, `/auth/login`, and public `/stocks*` GETs should require a valid bearer token, validated against AUTH_TOKENS.

## Suggested Additional (Non-CRUD) Endpoints
Useful given the "AI Financial Analytics" framing, though not directly modeled as entities:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | Aggregated view: portfolio value, recent transactions, active fraud alerts, latest recommendations |
| GET | `/health` | Service health check |
| GET | `/notifications` | Optional — surfacing fraud alerts / recommendations as push-style notifications |
