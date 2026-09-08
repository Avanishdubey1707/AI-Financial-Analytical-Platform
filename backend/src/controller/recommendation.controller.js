const Recommendation = require("../models/recommendation.model");
const Holding = require("../models/stocksModel/Holding.model");
const Portfolio = require("../models/portfolio.model");
const Prediction = require("../models/stocksModel/prediction.model");
const StockPrice = require("../models/stocksModel/stockPrice.model");
const ApiResponse = require("../utils/ApiResponse");

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

// ────────────────────────────────────────────────────────────
// POST /recommendations/generate
// Run the recommendation engine for the logged-in user, combining
// their current holdings with the latest predictions, and persist
// the results.
// ────────────────────────────────────────────────────────────
const generateRecommendations = async (req, res) => {
  try {
    // gather all stock symbols the user currently holds, across all portfolios
    const portfolios = await Portfolio.find({ userId: req.user.id }).distinct("_id");
    const holdings = await Holding.find({ portfolioId: { $in: portfolios } });

    if (holdings.length === 0) {
      return res
        .status(422)
        .json(
          new ApiResponse(422, "No holdings found — add holdings before generating recommendations"),
        );
    }

    const symbols = [...new Set(holdings.map((h) => h.stockSymbol))];

    // get the latest prediction per held symbol
    const latestPredictions = await Prediction.aggregate([
      { $match: { stockSymbol: { $in: symbols } } },
      { $sort: { predictionDate: -1 } },
      { $group: { _id: "$stockSymbol", prediction: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$prediction" } },
    ]);
    const predictionMap = new Map(latestPredictions.map((p) => [p.stockSymbol, p]));

    // get the latest actual price per held symbol
    const latestPrices = await StockPrice.aggregate([
      { $match: { stockSymbol: { $in: symbols } } },
      { $sort: { date: -1 } },
      { $group: { _id: "$stockSymbol", close: { $first: "$close" } } },
    ]);
    const priceMap = new Map(latestPrices.map((p) => [p._id, p.close]));

    const newRecommendations = [];

    for (const holding of holdings) {
      const prediction = predictionMap.get(holding.stockSymbol);
      const currentPrice = priceMap.get(holding.stockSymbol);

      if (!prediction || currentPrice == null) continue; // not enough data for this stock

      const { action, reason } = buildRecommendation({
        currentPrice,
        predictedPrice: prediction.predictedPrice,
        avgPrice: holding.avgPrice,
      });

      if (action === "hold") continue; // don't bother storing neutral recommendations

      newRecommendations.push({
        userId: req.user.id,
        stockSymbol: holding.stockSymbol,
        reason,
        createdAt: new Date(),
      });
    }

    if (newRecommendations.length === 0) {
      return res.status(200).json(
        new ApiResponse(200, "No new recommendations at this time", {
          recommendations: [],
        }),
      );
    }

    const created = await Recommendation.insertMany(newRecommendations);

    return res
      .status(201)
      .json(new ApiResponse(201, "Recommendations generated", { recommendations: created }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

/**
 * Simple rules-based recommendation logic — swap this out for a call to
 * a real recommendation model if you have one. Compares the predicted
 * price against the current price and the user's cost basis.
 */
const buildRecommendation = ({ currentPrice, predictedPrice, avgPrice }) => {
  const expectedChangePercent = ((predictedPrice - currentPrice) / currentPrice) * 100;

  if (expectedChangePercent >= 5) {
    return {
      action: "buy_more",
      reason: `Model predicts a ${expectedChangePercent.toFixed(1)}% upside from the current price — consider increasing your position.`,
    };
  }

  if (expectedChangePercent <= -5) {
    const gainLossPercent = ((currentPrice - avgPrice) / avgPrice) * 100;
    return {
      action: "sell",
      reason: `Model predicts a ${Math.abs(expectedChangePercent).toFixed(1)}% downside. You are currently ${
        gainLossPercent >= 0 ? "up" : "down"
      } ${Math.abs(gainLossPercent).toFixed(1)}% on this position — consider reducing exposure.`,
    };
  }

  return { action: "hold", reason: "" };
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