const Recommendation = require("../models/recommendation.model");
const Holding = require("../models/stocksModel/Holding.model");
const Portfolio = require("../models/portfolio.model");
const Prediction = require("../models/stocksModel/prediction.model");
const StockPrice = require("../models/stocksModel/stockPrice.model");
const ApiResponse = require("../utils/ApiResponse");
const ml = require("../utils/mlClient");
const { sendMlError } = require("../utils/mlError");

// ────────────────────────────────────────────────────────────
// GET /recommendations
// List recommendations generated for the logged-in user.
// Query params: page, limit
// ────────────────────────────────────────────────────────────
const getAllRecommendations = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [recommendations, total] = await Promise.all([
      Recommendation.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Recommendation.countDocuments({ userId: req.user.id }),
    ]);

    return res.status(200).json(
      new ApiResponse(200, "Recommendations fetched", {
        recommendations,
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


const RISK_PROFILES = ["conservative", "moderate", "aggressive"];
const MAX_PREDICTION_AGE_DAYS = 7; // used only when a prediction has no targetDate
const DAY_MS = 24 * 60 * 60 * 1000;

// confidence may be stored as 0-1 or 0-100; the engine expects 0-1
const normalizeConfidence = (c) => {
  const n = Number(c);
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(Math.max(n > 1 ? n / 100 : n, 0), 1);
};

// calendar days between prediction and target -> approx. trading days
const horizonInTradingDays = (p) => {
  if (p.targetDate && p.predictionDate) {
    const days = (new Date(p.targetDate) - new Date(p.predictionDate)) / DAY_MS;
    if (days > 0) return Math.max(1, Math.round((days * 5) / 7));
  }
  return Number(p.horizonDays) || 5;
};

// an old prediction should not drive a buy/sell suggestion today
const isStale = (p, now) => {
  if (p.targetDate) return new Date(p.targetDate) < now;
  return (now - new Date(p.predictionDate)) / DAY_MS > MAX_PREDICTION_AGE_DAYS;
};

// ────────────────────────────────────────────────────────────
// POST /recommendations/generate
// Body (optional): { riskProfile: "conservative" | "moderate" | "aggressive" }
// ────────────────────────────────────────────────────────────
const generateRecommendations = async (req, res) => {
  try {
    const riskProfile = req.body?.riskProfile ?? "moderate";
    if (!RISK_PROFILES.includes(riskProfile)) {
      return res
        .status(400)
        .json(new ApiResponse(400, `riskProfile must be one of: ${RISK_PROFILES.join(", ")}`));
    }

    // all holdings across all of the user's portfolios
    const portfolios = await Portfolio.find({ userId: req.user.id }).distinct("_id");
    const holdings = await Holding.find({ portfolioId: { $in: portfolios } }).lean();

    if (holdings.length === 0) {
      return res
        .status(422)
        .json(
          new ApiResponse(422, "No holdings found — add holdings before generating recommendations"),
        );
    }

    // the same stock can sit in several portfolios -> merge into ONE position per symbol
    // (otherwise the engine would give duplicate recommendations for it)
    const merged = new Map();
    for (const h of holdings) {
      const m = merged.get(h.stockSymbol) || { quantity: 0, cost: 0 };
      m.quantity += h.quantity;
      m.cost += h.quantity * h.avgPrice;
      merged.set(h.stockSymbol, m);
    }
    const symbols = [...merged.keys()];
    const mlHoldings = symbols.map((sym) => {
      const m = merged.get(sym);
      return {
        stock_symbol: sym,
        quantity: m.quantity,
        avg_price: m.quantity > 0 ? m.cost / m.quantity : 0,
      };
    });

    // latest stored prediction per symbol
    const latestPredictions = await Prediction.aggregate([
      { $match: { stockSymbol: { $in: symbols } } },
      { $sort: { predictionDate: -1 } },
      { $group: { _id: "$stockSymbol", prediction: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$prediction" } },
    ]);
    const predictionMap = new Map(latestPredictions.map((p) => [p.stockSymbol, p]));

    // latest actual close per symbol
    const latestPrices = await StockPrice.aggregate([
      { $match: { stockSymbol: { $in: symbols } } },
      { $sort: { date: -1 } },
      { $group: { _id: "$stockSymbol", close: { $first: "$close" } } },
    ]);
    const priceMap = new Map(latestPrices.map((p) => [p._id, p.close]));

    // build the engine's `predictions` input
    const now = new Date();
    const predictions = {};
    let usablePredictions = 0;
    for (const sym of symbols) {
      const price = priceMap.get(sym);
      if (!(price > 0)) continue; // no market price -> engine falls back to avg price

      const p = predictionMap.get(sym);
      if (p && Number.isFinite(p.predictedPrice) && !isStale(p, now)) {
        usablePredictions++;
        predictions[sym] = {
          current_price: price,
          predicted_return_pct: (p.predictedPrice / price - 1) * 100,
          confidence: normalizeConfidence(p.confidence),
          horizon_days: horizonInTradingDays(p),
        };
      } else {
        // neutral placeholder: keeps the position's value correct for the
        // concentration check but gives no buy/sell signal of its own
        predictions[sym] = {
          current_price: price,
          predicted_return_pct: 0,
          confidence: 0,
          horizon_days: 5,
        };
      }
    }

    if (usablePredictions === 0) {
      return res.status(200).json(
        new ApiResponse(200, "No fresh predictions for your holdings — generate predictions first", {
          recommendations: [],
        }),
      );
    }

    // ── AI MODEL CALL ────────────────────────────────────────
    const results = await ml.recommend(mlHoldings, predictions, riskProfile);
    // ─────────────────────────────────────────────────────────

    // don't store neutral suggestions
    const newRecommendations = results
      .filter((r) => r.action !== "HOLD")
      .map((r) => ({
        userId: req.user.id,
        stockSymbol: r.stock_symbol,
        reason: r.reasoning,
        createdAt: new Date(),
        // add these to your Recommendation schema, otherwise Mongoose silently drops them:
        action: r.action, // "BUY" | "SELL" | "REDUCE"
        confidence: r.confidence,
        expectedReturnPct: r.expected_return_pct,
      }));

    if (newRecommendations.length === 0) {
      return res.status(200).json(
        new ApiResponse(200, "No new recommendations at this time", { recommendations: [] }),
      );
    }

    const created = await Recommendation.insertMany(newRecommendations);

    return res
      .status(201)
      .json(new ApiResponse(201, "Recommendations generated", { recommendations: created }));
  } catch (error) {
    return sendMlError(res, error, ApiResponse);
  }
};


// ────────────────────────────────────────────────────────────
// GET /recommendations/:id
// Get a single recommendation and its reasoning.
// ────────────────────────────────────────────────────────────
const getRecommendationById = async (req, res) => {
  try {
    const { id } = req.params;

    const recommendation = await Recommendation.findById(id);
    if (!recommendation) {
      return res.status(404).json(new ApiResponse(404, "Recommendation not found"));
    }

    if (recommendation.userId.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json(new ApiResponse(403, "You do not have access to this recommendation"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Recommendation fetched", { recommendation }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// DELETE /recommendations/:id
// Dismiss a recommendation.
// ────────────────────────────────────────────────────────────
const dismissRecommendation = async (req, res) => {
  try {
    const { id } = req.params;

    const recommendation = await Recommendation.findById(id);
    if (!recommendation) {
      return res.status(404).json(new ApiResponse(404, "Recommendation not found"));
    }

    if (recommendation.userId.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json(new ApiResponse(403, "You do not have access to this recommendation"));
    }

    await recommendation.deleteOne();

    return res.status(200).json(new ApiResponse(200, "Recommendation dismissed"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

module.exports = {
  getAllRecommendations,
  generateRecommendations,
  getRecommendationById,
  dismissRecommendation,
};