const Stock = require("../../models/stocksModel/stock.model");
const StockPrice = require("../../models/stocksModel/stockPrice.model");
const Prediction = require("../../models/stocksModel/prediction.model");
const ApiResponse = require("../../utils/ApiResponse");

// ────────────────────────────────────────────────────────────
// GET /stocks/:symbol/predictions
// All predictions stored for a stock. Optional filter: modelUsed.
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
// Body (optional): { modelUsed }  — which model variant to run
// ────────────────────────────────────────────────────────────
const generatePrediction = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { modelUsed = "default" } = req.body;

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) {
      return res.status(404).json(new ApiResponse(404, "Stock not found"));
    }

    // pull recent price history to feed into the model
    const recentPrices = await StockPrice.find({ stockSymbol: stock.symbol })
      .sort({ date: -1 })
      .limit(30);

    if (recentPrices.length === 0) {
      return res
        .status(422)
        .json(
          new ApiResponse(422, "Not enough price history to generate a prediction"),
        );
    }

    const predictedPrice = await runPredictionModel(recentPrices, modelUsed);

    const prediction = await Prediction.create({
      stockSymbol: stock.symbol,
      predictedPrice,
      modelUsed,
      predictionDate: new Date(),
    });

    return res
      .status(201)
      .json(new ApiResponse(201, "Prediction generated", { prediction }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

/**
 * Stub model runner — replace with a real call to your ML service
 * (e.g. an HTTP request to a Python inference server, or a SageMaker/
 * Vertex AI endpoint). Must resolve to a single predicted price (number).
 *
 * The naive placeholder below just projects forward using the recent
 * average daily change, purely so the endpoint is functional end-to-end.
 */
const runPredictionModel = async (recentPrices, modelUsed) => {
  // recentPrices is sorted newest-first
  const closes = recentPrices.map((p) => p.close).reverse(); // oldest -> newest

  let totalChange = 0;
  for (let i = 1; i < closes.length; i++) {
    totalChange += closes[i] - closes[i - 1];
  }
  const avgDailyChange = closes.length > 1 ? totalChange / (closes.length - 1) : 0;
  const lastClose = closes[closes.length - 1];

  return Number((lastClose + avgDailyChange).toFixed(2));
};

// ────────────────────────────────────────────────────────────
// GET /predictions/:id
// Get a single prediction's detail.
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
// Latest prediction per stock, across all stocks (or a filtered
// set via ?symbols=AAPL,MSFT for a watchlist-style view).
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