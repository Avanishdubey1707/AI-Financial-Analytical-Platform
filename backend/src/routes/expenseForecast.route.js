const express = require("express");
const router = express.Router();

const {
  getAllExpenseForecasts,
  generateExpenseForecasts,
  getExpenseForecastById,
  getExpenseForecastSummary,
} = require("../controller/expenseForecast.controller");
const verifyJWT = require("../middleware/auth.middleware");

router.use(verifyJWT);

// IMPORTANT: /expense-forecasts/generate and /summary must be registered
// before /expense-forecasts/:id, or Express will treat "generate"/"summary"
// as an :id value.
router.get("/expense-forecasts", getAllExpenseForecasts);
router.post("/expense-forecasts/generate", generateExpenseForecasts);
router.get("/expense-forecasts/summary", getExpenseForecastSummary);
router.get("/expense-forecasts/:id", getExpenseForecastById);

module.exports = router;