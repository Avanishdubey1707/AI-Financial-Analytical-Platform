const Transaction = require("../models/transaction.model");
const ExpenseForecast = require("../models/expenseForecast.model");
const ApiResponse = require("../utils/ApiResponse");
const ml = require("../utils/mlClient"); // adjust the path to where you put mlClient.js


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
      ExpenseForecast.find(filter)
        .sort({ month: -1 })
        .skip(skip)
        .limit(limitNum),
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
    const { monthsOfHistory = 12, monthsToForecast = 1 } = req.body;

    // start from the 1st of the month so the oldest month is complete
    // (a mid-month cutoff would give the model a partial month and skew the trend)
    const now = new Date();
    const since = new Date(
      now.getFullYear(),
      now.getMonth() - monthsOfHistory,
      1,
    );

    const transactions = await Transaction.find({
      userId: req.user.id,
      type: "expense",
      date: { $gte: since },
    })
      .sort({ date: 1 })
      .lean();

    if (transactions.length === 0) {
      return res
        .status(422)
        .json(
          new ApiResponse(
            422,
            "Not enough transaction history to generate a forecast",
          ),
        );
    }

    // ── AI MODEL CALL ────────────────────────────────────────
    // The Python service groups spend by category and month itself,
    // so we only send plain transaction rows.
    const payload = transactions.map((t) => ({
      type: t.type,
      amount: t.amount,
      category: t.category,
      date: new Date(t.date).toISOString(),
    }));

    const forecastResults = await ml.forecastExpenses(
      payload,
      monthsToForecast,
    );
    // ─────────────────────────────────────────────────────────

    // The service also returns a "TOTAL" row per month; skip it because
    // your ExpenseForecast documents are per category.
    const docsToInsert = forecastResults
      .filter((f) => f.category !== "TOTAL")
      .map((f) => ({
        userId: req.user.id,
        month: f.month.slice(0, 7), // "2026-10-01" -> "2026-10"
        category: f.category,
        predictedAmount: f.predicted_amount,
      }));

    // upsert so re-running "generate" updates instead of duplicating
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
      .json(
        new ApiResponse(201, "Expense forecasts generated", {
          forecasts: saved,
        }),
      );
  } catch (error) {
    console.error(error);

    // the ML service answered with a validation problem (e.g. too little history)
    if (error.status === 422) {
      return res.status(422).json(new ApiResponse(422, error.message));
    }
    // the ML service is down, unreachable or timed out
    if (
      !error.status &&
      (error.name === "TimeoutError" ||
        error.cause ||
        error.name === "TypeError")
    ) {
      return res
        .status(503)
        .json(
          new ApiResponse(503, "Forecasting service is currently unavailable"),
        );
    }
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
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

    return res
      .status(200)
      .json(new ApiResponse(200, "Forecast fetched", { forecast }));
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
    const forecastMap = new Map(
      forecasts.map((f) => [f.category, f.predictedAmount]),
    );

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
        variancePercent: predictedAmount
          ? (variance / predictedAmount) * 100
          : null,
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
