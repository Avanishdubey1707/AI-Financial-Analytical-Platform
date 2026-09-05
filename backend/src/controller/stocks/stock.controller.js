const Stock = require("../models/stock.model");
const StockPrice = require("../models/stockPrice.model");
const ApiResponse = require("../utils/ApiResponse");

// ────────────────────────────────────────────────────────────
// GET /stocks
// List/search available stocks. Public data — no ownership check.
// Query params: search (name/symbol), sector, exchange, page, limit
// ────────────────────────────────────────────────────────────
const getAllStocks = async (req, res) => {
  try {
    const { search, sector, exchange, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (sector) filter.sector = sector;
    if (exchange) filter.exchange = exchange;
    if (search) {
      filter.$or = [
        { symbol: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [stocks, total] = await Promise.all([
      Stock.find(filter).sort({ symbol: 1 }).skip(skip).limit(limitNum),
      Stock.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(200, "Stocks fetched", {
        stocks,
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
// GET /stocks/:symbol
// Get a single stock's details.
// ────────────────────────────────────────────────────────────
const getStockBySymbol = async (req, res) => {
  try {
    const { symbol } = req.params;

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) {
      return res.status(404).json(new ApiResponse(404, "Stock not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Stock fetched", { stock }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// GET /stocks/:symbol/prices
// Historical OHLCV data. Query params: from, to, interval (reserved
// for future resampling — daily data is returned as-is for now).
// ────────────────────────────────────────────────────────────
const getStockPrices = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { from, to, limit = 200 } = req.query;

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) {
      return res.status(404).json(new ApiResponse(404, "Stock not found"));
    }

    const filter = { stockSymbol: stock.symbol };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const limitNum = Math.min(Math.max(Number(limit) || 200, 1), 1000);

    const prices = await StockPrice.find(filter)
      .sort({ date: 1 })
      .limit(limitNum);

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Stock prices fetched", {
          symbol: stock.symbol,
          prices,
        }),
      );
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// GET /stocks/:symbol/prices/latest
// Most recent price snapshot for a stock.
// ────────────────────────────────────────────────────────────
const getLatestStockPrice = async (req, res) => {
  try {
    const { symbol } = req.params;

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) {
      return res.status(404).json(new ApiResponse(404, "Stock not found"));
    }

    const latestPrice = await StockPrice.findOne({
      stockSymbol: stock.symbol,
    }).sort({
      date: -1,
    });

    if (!latestPrice) {
      return res
        .status(404)
        .json(new ApiResponse(404, "No price data available for this stock"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Latest price fetched", { latestPrice }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// POST /stocks/:symbol/prices
// Ingest a new price record. Internal/admin use — called by your
// data pipeline, not by regular end users.
// ────────────────────────────────────────────────────────────
const addStockPrice = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json(new ApiResponse(403, "Admin access required"));
    }

    const { symbol } = req.params;
    const { date, open, close, high, low, volume } = req.body;

    if (
      date == null ||
      open == null ||
      close == null ||
      high == null ||
      low == null ||
      volume == null
    ) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "date, open, close, high, low and volume are all required",
          ),
        );
    }

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) {
      return res.status(404).json(new ApiResponse(404, "Stock not found"));
    }

    // upsert — avoid duplicate rows if the pipeline retries for the same date
    const price = await StockPrice.findOneAndUpdate(
      { stockSymbol: stock.symbol, date: new Date(date) },
      { open, close, high, low, volume },
      { upsert: true, new: true },
    );

    return res
      .status(201)
      .json(new ApiResponse(201, "Stock price recorded", { price }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// GET /stocks/:symbol/chart
// Formatted time-series data ready for charting (parallel arrays,
// easy to hand straight to a charting library).
// ────────────────────────────────────────────────────────────
const getStockChart = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { from, to, limit = 200 } = req.query;

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) {
      return res.status(404).json(new ApiResponse(404, "Stock not found"));
    }

    const filter = { stockSymbol: stock.symbol };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const limitNum = Math.min(Math.max(Number(limit) || 200, 1), 1000);
    const prices = await StockPrice.find(filter)
      .sort({ date: 1 })
      .limit(limitNum);

    const chart = {
      labels: prices.map((p) => p.date.toISOString().slice(0, 10)),
      open: prices.map((p) => p.open),
      close: prices.map((p) => p.close),
      high: prices.map((p) => p.high),
      low: prices.map((p) => p.low),
      volume: prices.map((p) => p.volume),
    };

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Chart data fetched", {
          symbol: stock.symbol,
          chart,
        }),
      );
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

module.exports = {
  getAllStocks,
  getStockBySymbol,
  getStockPrices,
  getLatestStockPrice,
  addStockPrice,
  getStockChart,
};
