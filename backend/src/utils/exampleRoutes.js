// Example Express routes. Replace the `db.*` calls with your own queries (Prisma / Sequelize / Mongoose / SQL).
const express = require("express");
const ml = require("../../../ml_model/node/mlClient");
const router = express.Router();
// const auth = require("../middleware/auth");   // your existing JWT/bearer middleware -> sets req.user.id
// const db = require("../db");                  // your data layer

// ---- Fraud: call this inside POST /transactions AFTER saving the transaction (don't block the response) ----
async function runFraudCheck(userId, txn) {
  const history = await db.getUserTransactions(userId, 1000);           // [{id, amount, date, category, type}]
  const result = await ml.scoreFraud(txn, history);
  if (result.is_flagged) {
    await db.saveFraudAlert({ transaction_id: txn.id, risk_score: result.risk_score, status: result.status, reasons: result.reasons });
  }
  return result;
}
// in your create-transaction handler:  runFraudCheck(req.user.id, savedTxn).catch(console.error);

router.post("/transactions/:id/check-fraud", /* auth, */ async (req, res, next) => {
  try {
    const txn = await db.getTransaction(req.user.id, req.params.id);
    if (!txn) return res.status(404).json({ error: "Transaction not found" });
    res.json(await runFraudCheck(req.user.id, txn));
  } catch (e) { next(e); }
});

// ---- Stock prediction ----
router.post("/stocks/:symbol/predictions", /* auth, */ async (req, res, next) => {
  try {
    const prices = await db.getStockPrices(req.params.symbol, 1500);    // [{date, open, high, low, close, volume}]
    if (!prices.length) return res.status(404).json({ error: "No price data" });
    const prediction = await ml.predictStock(req.params.symbol, prices, Number(req.query.horizon_days) || 5);
    await db.savePrediction(prediction);
    res.json(prediction);
  } catch (e) { next(e); }
});

// ---- Recommendations ----
router.post("/recommendations/generate", /* auth, */ async (req, res, next) => {
  try {
    const holdings = await db.getUserHoldings(req.user.id);             // [{stock_symbol, quantity, avg_price}]
    const watchlist = (await db.getUserWatchlist?.(req.user.id)) || [];
    const symbols = [...new Set([...holdings.map(h => h.stock_symbol.toUpperCase()), ...watchlist.map(s => s.toUpperCase())])];
    const predictions = await db.getLatestPredictions(symbols);         // { AAPL: {...prediction object...} }
    for (const s of symbols) {
      if (!predictions[s]) {
        const prices = await db.getStockPrices(s, 1500);
        if (prices.length) {
          try { predictions[s] = await ml.predictStock(s, prices, 5); await db.savePrediction(predictions[s]); } catch (_) {}
        }
      }
    }
    const recs = await ml.recommend(holdings, predictions, req.query.risk_profile || "moderate", watchlist);
    res.json(await db.saveRecommendations(req.user.id, recs));
  } catch (e) { next(e); }
});

// ---- Expense forecasts ----
router.post("/expense-forecasts/generate", /* auth, */ async (req, res, next) => {
  try {
    const tx = await db.getUserTransactions(req.user.id, 20000);
    const rows = await ml.forecastExpenses(tx, Number(req.query.months_ahead) || 3);
    res.json(await db.saveExpenseForecasts(req.user.id, rows));
  } catch (e) { next(e); }
});

router.get("/expense-forecasts/summary", /* auth, */ async (req, res, next) => {
  try {
    const [forecasts, tx] = await Promise.all([db.getExpenseForecasts(req.user.id), db.getUserTransactions(req.user.id, 20000)]);
    res.json(await ml.forecastSummary(forecasts, tx));
  } catch (e) { next(e); }
});

module.exports = router;
// app.use("/api/v1", require("./routes/mlRoutes"));
