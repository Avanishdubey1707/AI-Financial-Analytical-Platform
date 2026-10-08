const Stock = require("../../models/stocksModel/stock.model");
const StockPrice = require("../../models/stocksModel/stockPrice.model");
const Prediction = require("../../models/stocksModel/prediction.model");
const ApiResponse = require("../../utils/ApiResponse");
const ml = require("../../utils/mlClient");
const { sendMlError } = require("../utils/mlError");

// ── model settings ──────────────────────────────────────────
const MODEL_NAME = "RandomForest_v1"; // what the Python service reports as model_used
const SUPPORTED_MODELS = ["default", MODEL_NAME]; // "default" = the current production model
const DEFAULT_HORIZON_DAYS = 5; // trading days ahead
const MAX_HORIZON_DAYS = 60;
const MAX_PRICE_ROWS = 1500; // about 6 years of daily data; the model needs at least 150 rows
const PREDICTION_DISCLAIMER =
  "Predictions are statistical estimates produced by a machine-learning model. They are not financial advice and can be wrong.";

// ────────────────────────────────────────────────────────────
// GET /stocks/:symbol/predictions
// ────────────────────────────────────────────────────────────
const getPredictionsForStock = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { modelUsed, limit = 50 } = req.query;

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) {
      return res.status(404).json(new ApiResponse(404, "Stock not found"));
    }

    const filter = { stockSymbol: stock.symbol };
    if (modelUsed) filter.modelUsed = modelUsed;

    const limitNum = Math.min(Math.max(Number(limit) || 50, 1), 200);

    const predictions = await Prediction.find(filter)
      .sort({ predictionDate: -1 })
      .limit(limitNum);

    return res
      .status(200)
      .json(new ApiResponse(200, "Predictions fetched", { symbol: stock.symbol, predictions }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// POST /stocks/:symbol/predictions
// Trigger the ML model to generate a new prediction and store it.
// Body (all optional):
//   modelUsed    – "default" (or the model's name)
//   horizonDays  – trading days ahead, 1-60 (default 5)
//   forceRetrain – admin only: retrain the model now instead of reusing the cached one
// ────────────────────────────────────────────────────────────
const generatePrediction = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { modelUsed = "default", horizonDays = DEFAULT_HORIZON_DAYS, forceRetrain = false } =
      req.body ?? {};

    if (!SUPPORTED_MODELS.includes(modelUsed)) {
      return res
        .status(400)
        .json(new ApiResponse(400, `modelUsed must be one of: ${SUPPORTED_MODELS.join(", ")}`));
    }
    const horizon = Number(horizonDays);
    if (!Number.isInteger(horizon) || horizon < 1 || horizon > MAX_HORIZON_DAYS) {
      return res
        .status(400)
        .json(new ApiResponse(400, `horizonDays must be a whole number from 1 to ${MAX_HORIZON_DAYS}`));
    }

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) {
      return res.status(404).json(new ApiResponse(404, "Stock not found"));
    }

    // retraining is expensive, so only admins may force it
    const retrain = forceRetrain === true && req.user?.role === "admin";

    // if two requests for the same stock arrive together, do the work once and share the result
    const { prediction, analysis } = await runOnce(`${stock.symbol}:${horizon}:${retrain}`, async () => {
      // price history to feed the model (newest first; the service sorts it itself)
      const recentPrices = await StockPrice.find({ stockSymbol: stock.symbol })
        .sort({ date: -1 })
        .limit(MAX_PRICE_ROWS)
        .lean();

      if (recentPrices.length === 0) {
        const err = new Error("Not enough price history to generate a prediction");
        err.status = 422; // reported to the client by sendMlError
        throw err;
      }

      // ── AI MODEL CALL ──────────────────────────────────────
      const result = await ml.predictStock(
        stock.symbol,
        recentPrices.map((p) => ({
          date: new Date(p.date).toISOString(),
          open: p.open,
          high: p.high,
          low: p.low,
          close: p.close,
          volume: p.volume,
        })),
        horizon,
        retrain,
      );
      // ───────────────────────────────────────────────────────

      const created = await Prediction.create({
        stockSymbol: stock.symbol,
        predictedPrice: result.predicted_price,
        modelUsed: result.model_used,
        predictionDate: new Date(),
        // add these fields to your Prediction schema, otherwise Mongoose silently drops them:
        targetDate: new Date(result.target_date),
        horizonDays: result.horizon_days,
        confidence: result.confidence, // 0-1
        direction: result.direction, // "UP" | "DOWN" | "FLAT"
        lowerPrice: result.lower_price, // ~90% price range
        upperPrice: result.upper_price,
        currentPrice: result.current_price, // last close when the prediction was made
        reliable: result.reliable, // false = model did not beat a "no change" guess when tested
      });

      return {
        prediction: created,
        analysis: {
          direction: result.direction,
          expectedReturnPct: result.predicted_return_pct,
          lowerPrice: result.lower_price,
          upperPrice: result.upper_price,
          confidence: result.confidence,
          reliable: result.reliable,
          metrics: result.metrics, // validation results of the model
          disclaimer: PREDICTION_DISCLAIMER,
        },
      };
    });

    return res
      .status(201)
      .json(new ApiResponse(201, "Prediction generated", { prediction, analysis }));
  } catch (error) {
    return sendMlError(res, error, ApiResponse);
  }
};

// simple in-process de-duplication of identical in-flight jobs
const inFlight = new Map();
const runOnce = (key, job) => {
  if (inFlight.has(key)) return inFlight.get(key);
  const promise = job().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
};

// ────────────────────────────────────────────────────────────
// GET /predictions/:id
// ────────────────────────────────────────────────────────────
const getPredictionById = async (req, res) => {
  try {
    const { id } = req.params;

    const prediction = await Prediction.findById(id);
    if (!prediction) {
      return res.status(404).json(new ApiResponse(404, "Prediction not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Prediction fetched", { prediction }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// GET /predictions/latest
// ────────────────────────────────────────────────────────────
const getLatestPredictions = async (req, res) => {
  try {
    const { symbols } = req.query;

    const match = {};
    if (symbols) {
      const symbolList = symbols.split(",").map((s) => s.trim().toUpperCase());
      match.stockSymbol = { $in: symbolList };
    }

    // one prediction per stock — the most recent by predictionDate
    const latest = await Prediction.aggregate([
      { $match: match },
      { $sort: { predictionDate: -1 } },
      {
        $group: {
          _id: "$stockSymbol",
          prediction: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$prediction" } },
      { $sort: { stockSymbol: 1 } },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, "Latest predictions fetched", { predictions: latest }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

module.exports = {
  getPredictionsForStock,
  generatePrediction,
  getPredictionById,
  getLatestPredictions,
};