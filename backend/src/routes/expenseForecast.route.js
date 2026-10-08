const express = require("express");

const router = express.Router();

const {
  getAllExpenseForecasts,
  generateExpenseForecasts,
  getExpenseForecastById,
  getExpenseForecastSummary,
} = require("../controller/expenseForecast.controller");

const verifyJWT = require("../middleware/auth.middleware");

// ============================================================
// AUTH
// ============================================================

router.use(verifyJWT);

// ============================================================
// EXPENSE FORECAST
// ============================================================

// GET /api/v1/expense-forecasts
router.get("/", getAllExpenseForecasts);

// POST /api/v1/expense-forecasts/generate
router.post(
  "/generate",
  generateExpenseForecasts
);

// GET /api/v1/expense-forecasts/summary
// Must be before /:id
router.get(
  "/summary",
  getExpenseForecastSummary
);

// GET /api/v1/expense-forecasts/:id
router.get(
  "/:id",
  getExpenseForecastById
);

module.exports = router;