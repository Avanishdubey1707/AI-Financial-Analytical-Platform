// Thin client for the Python ML service. Needs Node 18+ (built-in fetch). No extra npm packages.
// CommonJS version. If your package.json has "type": "module", see the ESM note in the README.
const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
const ML_KEY = process.env.ML_API_KEY || "";

// FastAPI returns `detail` as a string for our own errors, but as an array of objects for
// request-validation errors (e.g. months_ahead out of range). Turn both into a readable message.
function formatDetail(detail, status) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => `${(d.loc || []).slice(1).join(".")}: ${d.msg}`).join("; ");
  }
  return `ML service error ${status}`;
}

async function call(path, body) {
  let res;
  try {
    res = await fetch(`${ML_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(ML_KEY && { "x-api-key": ML_KEY }) },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000), // training a stock model can take a while
    });
  } catch (cause) {
    // service down, wrong URL, connection refused, or timeout
    const err = new Error("ML service unreachable");
    err.code = "ML_UNAVAILABLE";
    err.cause = cause;
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(formatDetail(data.detail, res.status));
    err.status = res.status;
    throw err;
  }
  return data;
}

module.exports = {
  scoreFraud: (transaction, history) => call("/ml/fraud/score", { transaction, history }),
  predictStock: (symbol, prices, horizonDays = 5, forceRetrain = false) =>
    call("/ml/stocks/predict", { symbol, prices, horizon_days: horizonDays, force_retrain: forceRetrain }),
  recommend: (holdings, predictions, riskProfile = "moderate", watchlist = []) =>
    call("/ml/recommendations", { holdings, predictions, risk_profile: riskProfile, watchlist }),
  forecastExpenses: (transactions, monthsAhead = 3) =>
    call("/ml/expenses/forecast", { transactions, months_ahead: monthsAhead }),
  forecastSummary: (forecasts, transactions) => call("/ml/expenses/summary", { forecasts, transactions }),
};
