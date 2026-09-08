const Portfolio = require("../models/portfolio.model");
const Holding = require("../models/stocksModel/Holding.model");
const Stock = require("../models/stocksModel/stock.model");
const StockPrice = require("../models/stocksModel/stockPrice.model");
const ApiResponse = require("../utils/ApiResponse");

/**
 * Small helper — confirms the portfolio exists AND belongs to the
 * logged-in user. Returns the portfolio doc, or null + sends the
 * appropriate error response itself.
 */
const findOwnedPortfolioOrRespond = async (req, res) => {
  const { id } = req.params;
  const portfolio = await Portfolio.findById(id);

  if (!portfolio) {
    res.status(404).json(new ApiResponse(404, "Portfolio not found"));
    return null;
  }

  if (portfolio.userId.toString() !== req.user.id.toString()) {
    res
      .status(403)
      .json(new ApiResponse(403, "You do not have access to this portfolio"));
    return null;
  }

  return portfolio;
};

// ────────────────────────────────────────────────────────────
// GET /portfolios — list all portfolios owned by the logged-in user
// ────────────────────────────────────────────────────────────
const getAllPortfolios = async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Portfolios fetched", { portfolios }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// POST /portfolios — create a new portfolio
// ────────────────────────────────────────────────────────────
const createPortfolio = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json(new ApiResponse(400, "Portfolio name is required"));
    }

    const portfolio = await Portfolio.create({
      name: name.trim(),
      userId: req.user.id,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, "Portfolio created", { portfolio }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// GET /portfolios/:id — get a single portfolio's details
// ────────────────────────────────────────────────────────────
const getPortfolioById = async (req, res) => {
  try {
    const portfolio = await findOwnedPortfolioOrRespond(req, res);
    if (!portfolio) return; // response already sent

    return res
      .status(200)
      .json(new ApiResponse(200, "Portfolio fetched", { portfolio }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// PUT /portfolios/:id — rename/update a portfolio
// ────────────────────────────────────────────────────────────
const updatePortfolio = async (req, res) => {
  try {
    const portfolio = await findOwnedPortfolioOrRespond(req, res);
    if (!portfolio) return;

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res
        .status(400)
        .json(new ApiResponse(400, "Portfolio name is required"));
    }

    portfolio.name = name.trim();
    await portfolio.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Portfolio updated", { portfolio }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// DELETE /portfolios/:id — delete a portfolio and its holdings
// ────────────────────────────────────────────────────────────
const deletePortfolio = async (req, res) => {
  try {
    const portfolio = await findOwnedPortfolioOrRespond(req, res);
    if (!portfolio) return;

    // delete dependent holdings first (or use a Mongoose pre-hook)
    await Holding.deleteMany({ portfolioId: portfolio._id });
    await portfolio.deleteOne();

    return res
      .status(200)
      .json(new ApiResponse(200, "Portfolio and its holdings deleted"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// GET /portfolios/:id/holdings — list holdings inside a portfolio
// ────────────────────────────────────────────────────────────
const getAllPortfolioHoldings = async (req, res) => {
  try {
    const portfolio = await findOwnedPortfolioOrRespond(req, res);
    if (!portfolio) return;

    const holdings = await Holding.find({ portfolioId: portfolio._id });

    return res
      .status(200)
      .json(
        new ApiResponse(200, "All holdings fetched", { portfolio, holdings }),
      );
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// POST /portfolios/:id/holdings — add a holding
// ────────────────────────────────────────────────────────────
const addHolding = async (req, res) => {
  try {
    const portfolio = await findOwnedPortfolioOrRespond(req, res);
    if (!portfolio) return;

    const { stockSymbol, quantity, avgPrice } = req.body;

    if (!stockSymbol || quantity == null || avgPrice == null) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, "stockSymbol, quantity and avgPrice are required"),
        );
    }
    if (quantity <= 0 || avgPrice <= 0) {
      return res
        .status(400)
        .json(new ApiResponse(400, "quantity and avgPrice must be positive"));
    }

    const stock = await Stock.findOne({ symbol: stockSymbol });
    if (!stock) {
      return res.status(404).json(new ApiResponse(404, "Stock not found"));
    }

    // if this stock is already held in the portfolio, merge instead of duplicating
    let holding = await Holding.findOne({
      portfolioId: portfolio._id,
      stockSymbol,
    });

    if (holding) {
      const totalQty = holding.quantity + quantity;
      // weighted average price
      holding.avgPrice =
        (holding.avgPrice * holding.quantity + avgPrice * quantity) / totalQty;
      holding.quantity = totalQty;
      await holding.save();
    } else {
      holding = await Holding.create({
        portfolioId: portfolio._id,
        stockSymbol,
        quantity,
        avgPrice,
      });
    }

    return res
      .status(201)
      .json(new ApiResponse(201, "Holding added", { holding }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// PUT /portfolios/:id/holdings/:holdingId — update a holding
// ────────────────────────────────────────────────────────────
const updateHolding = async (req, res) => {
  try {
    const portfolio = await findOwnedPortfolioOrRespond(req, res);
    if (!portfolio) return;

    const { holdingId } = req.params;
    const { quantity, avgPrice } = req.body;

    const holding = await Holding.findOne({
      _id: holdingId,
      portfolioId: portfolio._id,
    });

    if (!holding) {
      return res
        .status(404)
        .json(new ApiResponse(404, "Holding not found in this portfolio"));
    }

    if (quantity != null) {
      if (quantity <= 0) {
        return res
          .status(400)
          .json(new ApiResponse(400, "quantity must be positive"));
      }
      holding.quantity = quantity;
    }
    if (avgPrice != null) {
      if (avgPrice <= 0) {
        return res
          .status(400)
          .json(new ApiResponse(400, "avgPrice must be positive"));
      }
      holding.avgPrice = avgPrice;
    }

    await holding.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Holding updated", { holding }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// DELETE /portfolios/:id/holdings/:holdingId — remove a holding
// ────────────────────────────────────────────────────────────
const deleteHolding = async (req, res) => {
  try {
    const portfolio = await findOwnedPortfolioOrRespond(req, res);
    if (!portfolio) return;

    const { holdingId } = req.params;

    const holding = await Holding.findOneAndDelete({
      _id: holdingId,
      portfolioId: portfolio._id,
    });

    if (!holding) {
      return res
        .status(404)
        .json(new ApiResponse(404, "Holding not found in this portfolio"));
    }

    return res.status(200).json(new ApiResponse(200, "Holding removed"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// GET /portfolios/:id/value — current market value of the portfolio
// ────────────────────────────────────────────────────────────
const getPortfolioValue = async (req, res) => {
  try {
    const portfolio = await findOwnedPortfolioOrRespond(req, res);
    if (!portfolio) return;

    const holdings = await Holding.find({ portfolioId: portfolio._id });

    if (holdings.length === 0) {
      return res.status(200).json(
        new ApiResponse(200, "Portfolio value calculated", {
          totalValue: 0,
          totalCost: 0,
          totalGainLoss: 0,
          holdings: [],
        }),
      );
    }

    // fetch the latest price for every symbol held, in parallel
    const symbols = holdings.map((h) => h.stockSymbol);
    const latestPrices = await StockPrice.aggregate([
      { $match: { stockSymbol: { $in: symbols } } },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: "$stockSymbol",
          close: { $first: "$close" },
          date: { $first: "$date" },
        },
      },
    ]);

    const priceMap = new Map(latestPrices.map((p) => [p._id, p.close]));

    let totalValue = 0;
    let totalCost = 0;

    const holdingsWithValue = holdings.map((h) => {
      const currentPrice = priceMap.get(h.stockSymbol) ?? h.avgPrice;
      const marketValue = currentPrice * h.quantity;
      const costBasis = h.avgPrice * h.quantity;

      totalValue += marketValue;
      totalCost += costBasis;

      return {
        stockSymbol: h.stockSymbol,
        quantity: h.quantity,
        avgPrice: h.avgPrice,
        currentPrice,
        marketValue,
        gainLoss: marketValue - costBasis,
        gainLossPercent: costBasis ? ((marketValue - costBasis) / costBasis) * 100 : 0,
      };
    });

    return res.status(200).json(
      new ApiResponse(200, "Portfolio value calculated", {
        totalValue,
        totalCost,
        totalGainLoss: totalValue - totalCost,
        holdings: holdingsWithValue,
      }),
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// GET /portfolios/:id/performance — gain/loss over time
// ────────────────────────────────────────────────────────────
const getPortfolioPerformance = async (req, res) => {
  try {
    const portfolio = await findOwnedPortfolioOrRespond(req, res);
    if (!portfolio) return;

    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);

    const holdings = await Holding.find({ portfolioId: portfolio._id });
    if (holdings.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, "Portfolio performance calculated", { series: [] }));
    }

    const symbols = holdings.map((h) => h.stockSymbol);
    const qtyMap = new Map(holdings.map((h) => [h.stockSymbol, h.quantity]));

    const priceQuery = { stockSymbol: { $in: symbols } };
    if (from || to) priceQuery.date = dateFilter;

    const prices = await StockPrice.find(priceQuery).sort({ date: 1 });

    // group by date, sum (quantity * close) across all held stocks for that date
    const byDate = new Map();
    for (const p of prices) {
      const dateKey = p.date.toISOString().slice(0, 10);
      const qty = qtyMap.get(p.stockSymbol) ?? 0;
      byDate.set(dateKey, (byDate.get(dateKey) ?? 0) + qty * p.close);
    }

    const series = Array.from(byDate.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([date, value]) => ({ date, value }));

    return res
      .status(200)
      .json(new ApiResponse(200, "Portfolio performance calculated", { series }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

module.exports = {
  getAllPortfolios,
  createPortfolio,
  getPortfolioById,
  updatePortfolio,
  deletePortfolio,
  getAllPortfolioHoldings,
  addHolding,
  updateHolding,
  deleteHolding,
  getPortfolioValue,
  getPortfolioPerformance,
};