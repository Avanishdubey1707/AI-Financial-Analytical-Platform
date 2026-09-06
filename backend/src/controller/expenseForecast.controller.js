const Transaction = require("../models/transaction.model");
const ExpenseForecast = require("../models/expenseForecast.model");
const ApiResponse = require("../utils/ApiResponse");

// ────────────────────────────────────────────────────────────
// GET /expense-forecasts
// List forecasts for the logged-in user.
// Query params: month (e.g. "2026-09"), category, page, limit
// ────────────────────────────────────────────────────────────
const getAllExpenseForecasts = async (req, res) => {
  try {
    const { month, category, page = 1, limit = 20 } = req.query;

    const filter = { userId: req.user.id };
    if (month) filter.month = month;
    if (category) filter.category = category;

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [forecasts, total] = await Promise.all([
      ExpenseForecast.find(filter).sort({ month: -1 }).skip(skip).limit(limitNum),
      ExpenseForecast.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(200, "Expense forecasts fetched", {
        forecasts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      }),
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// POST /expense-forecasts/generate
// Run the forecasting model on the user's transaction history
// and store the results.
// Body (optional): { monthsOfHistory, monthsToForecast }
// ────────────────────────────────────────────────────────────
const generateExpenseForecasts = async (req, res) => {
  try {
    const { monthsOfHistory = 6, monthsToForecast = 1 } = req.body;

    const since = new Date();
    since.setMonth(since.getMonth() - monthsOfHistory);

    const transactions = await Transaction.find({
      userId: req.user.id,
      type: "expense",
      date: { $gte: since },
    }).sort({ date: 1 });

    if (transactions.length === 0) {
      return res
        .status(422)
        .json(
          new ApiResponse(422, "Not enough transaction history to generate a forecast"),
        );
    }

    // group historical spend by category and by month, so the model
    // gets a clean time series per category rather than a flat list
    const historyByCategory = groupSpendByCategoryAndMonth(transactions);

    // ── AI MODEL CALL ────────────────────────────────────────
    // This is the single place the forecasting model is invoked.
    // Swap runExpenseForecastModel()'s internals for a real call
    // (HTTP request to your ML service, a hosted LLM/forecast API,
    // a Python microservice, etc.) without touching anything above
    // or below this line.
    const forecastResults = await runExpenseForecastModel(historyByCategory, {
      monthsToForecast,
    });
    // ─────────────────────────────────────────────────────────

    // persist one ExpenseForecast row per {category, forecasted month}
    const docsToInsert = forecastResults.map((f) => ({
      userId: req.user.id,
      month: f.month, // e.g. "2026-10"
      category: f.category,
      predictedAmount: f.predictedAmount,
    }));

    // upsert each so re-running "generate" for the same month/category
    // updates the forecast instead of creating duplicates
    const saved = await Promise.all(
      docsToInsert.map((doc) =>
        ExpenseForecast.findOneAndUpdate(
          { userId: doc.userId, month: doc.month, category: doc.category },
          doc,
          { upsert: true, new: true },
        ),
      ),
    );

    return res
      .status(201)
      .json(new ApiResponse(201, "Expense forecasts generated", { forecasts: saved }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

/**
 * Reshapes raw transactions into:
 *   { [category]: [{ month: "2026-07", total: 1234.56 }, ...], ... }
 * sorted chronologically per category — this is the "features" the
 * model consumes.
 */
const groupSpendByCategoryAndMonth = (transactions) => {
  const grouped = {};

  for (const tx of transactions) {
    const monthKey = tx.date.toISOString().slice(0, 7); // "YYYY-MM"
    if (!grouped[tx.category]) grouped[tx.category] = {};
    grouped[tx.category][monthKey] = (grouped[tx.category][monthKey] || 0) + tx.amount;
  }

  const result = {};
  for (const [category, monthTotals] of Object.entries(grouped)) {
    result[category] = Object.entries(monthTotals)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([month, total]) => ({ month, total }));
  }

  return result;
};

/**
 * ── PLACEHOLDER — REPLACE WITH YOUR REAL MODEL CALL ──────────
 *
 * Input:  historyByCategory -> { category: [{month, total}, ...], ... }
 *         options.monthsToForecast -> how many months ahead to predict
 *
 * Output: an array of { category, month, predictedAmount }
 *
 * Example of what a real integration might look like:
 *
 *   const response = await fetch(process.env.FORECAST_MODEL_URL, {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ historyByCategory, monthsToForecast: options.monthsToForecast }),
 *   });
 *   const data = await response.json();
 *   return data.forecasts; // already in the { category, month, predictedAmount } shape
 *
 * Until that's wired up, this stub does a simple moving-average
 * projection per category so the endpoint is fully functional.
 */
const runExpenseForecastModel = async (historyByCategory, options) => {
  const { monthsToForecast } = options;
  const forecasts = [];

  const now = new Date();

  for (const [category, series] of Object.entries(historyByCategory)) {
    const totals = series.map((s) => s.total);
    const avg = totals.reduce((sum, v) => sum + v, 0) / totals.length;

    for (let i = 1; i <= monthsToForecast; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = targetDate.toISOString().slice(0, 7);

      forecasts.push({
        category,
        month: monthKey,
        predictedAmount: Number(avg.toFixed(2)),
      });
    }
  }

  return forecasts;
};

// ────────────────────────────────────────────────────────────
// GET /expense-forecasts/:id
// Get a single forecast entry.
// ────────────────────────────────────────────────────────────
const getExpenseForecastById = async (req, res) => {
  try {
    const { id } = req.params;

    const forecast = await ExpenseForecast.findById(id);
    if (!forecast) {
      return res.status(404).json(new ApiResponse(404, "Forecast not found"));
    }

    if (forecast.userId.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json(new ApiResponse(403, "You do not have access to this forecast"));
    }

    return res.status(200).json(new ApiResponse(200, "Forecast fetched", { forecast }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// GET /expense-forecasts/summary
// Forecast vs. actual spend comparison, by category, for a given month.
// Query params: month (required, e.g. "2026-09")
// ────────────────────────────────────────────────────────────
const getExpenseForecastSummary = async (req, res) => {
  try {
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res
        .status(400)
        .json(new ApiResponse(400, "month is required, in YYYY-MM format"));
    }

    const [year, mon] = month.split("-").map(Number);
    const startOfMonth = new Date(year, mon - 1, 1);
    const startOfNextMonth = new Date(year, mon, 1);

    const [forecasts, actuals] = await Promise.all([
      ExpenseForecast.find({ userId: req.user.id, month }),
      Transaction.aggregate([
        {
          $match: {
            userId: req.user.id,
            type: "expense",
            date: { $gte: startOfMonth, $lt: startOfNextMonth },
          },
        },
        { $group: { _id: "$category", actualAmount: { $sum: "$amount" } } },
      ]),
    ]);

    const actualMap = new Map(actuals.map((a) => [a._id, a.actualAmount]));
    const forecastMap = new Map(forecasts.map((f) => [f.category, f.predictedAmount]));

    const categories = new Set([...actualMap.keys(), ...forecastMap.keys()]);

    const comparison = Array.from(categories).map((category) => {
      const predictedAmount = forecastMap.get(category) ?? 0;
      const actualAmount = actualMap.get(category) ?? 0;
      const variance = actualAmount - predictedAmount;

      return {
        category,
        predictedAmount,
        actualAmount,
        variance,
        variancePercent: predictedAmount ? (variance / predictedAmount) * 100 : null,
      };
    });

    return res.status(200).json(
      new ApiResponse(200, "Forecast vs actual summary fetched", {
        month,
        comparison,
      }),
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

module.exports = {
  getAllExpenseForecasts,
  generateExpenseForecasts,
  getExpenseForecastById,
  getExpenseForecastSummary,
};