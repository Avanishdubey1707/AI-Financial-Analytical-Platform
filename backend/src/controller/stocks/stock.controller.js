const Stock = require("../../models/stocksModel/stock.model");
const StockPrice = require("../../models/stocksModel/stockPrice.model");
const Prediction = require("../../models/stocksModel/prediction.model");
const ApiResponse = require("../../utils/ApiResponse");
const ml = require("../../utils/mlClient");

// ── AI settings ─────────────────────────────────────────────
const DEFAULT_HORIZON_DAYS = 5; // trading days ahead for automatic refreshes
const MAX_PRICE_ROWS = 1500; // price history sent to the model
const MIN_ROWS_FOR_PREDICTION = 150; // the model cannot train on less
const MIN_REFRESH_INTERVAL_HOURS = 12; // don't re-predict the same stock more often than this
const MAX_DAILY_MOVE_PCT = 25; // a bigger one-day jump is reported as a warning on ingest
const DAY_MS = 24 * 60 * 60 * 1000;

// ────────────────────────────────────────────────────────────
// AI HELPERS
// ────────────────────────────────────────────────────────────

// a stored prediction is "fresh" until its target date passes (or 7 days if it has none)
const isFresh = (p, now = new Date()) => {
  if (p.targetDate) return new Date(p.targetDate) >= now;
  return (now - new Date(p.predictionDate)) / DAY_MS <= 7;
};

const getLatestPrediction = (symbol) =>
  Prediction.findOne({ stockSymbol: symbol }).sort({ predictionDate: -1 }).lean();

// shape of a prediction as shown to API clients
const toForecast = (p) => ({
  predictedPrice: p.predictedPrice,
  lowerPrice: p.lowerPrice ?? null, // ~90% price range
  upperPrice: p.upperPrice ?? null,
  targetDate: p.targetDate ?? null,
  predictionDate: p.predictionDate,
  direction: p.direction ?? null, // "UP" | "DOWN" | "FLAT"
  confidence: p.confidence ?? null, // 0-1
  reliable: p.reliable ?? null, // false = model did not beat a "no change" guess when tested
  modelUsed: p.modelUsed ?? null,
});

// symbols currently being refreshed, so two ingest calls can't start the same job twice
const refreshing = new Set();

/**
 * Fire-and-forget: generate and store a fresh prediction after new price data arrived.
 * It never blocks or fails the ingest request. If the AI service is down, it only logs.
 * Skips quietly when the stock was already predicted recently or has too little history.
 */
const refreshPredictionInBackground = (symbol) => {
  if (refreshing.has(symbol)) return;
  refreshing.add(symbol);

  (async () => {
    const last = await getLatestPrediction(symbol);
    if (last && Date.now() - new Date(last.predictionDate) < MIN_REFRESH_INTERVAL_HOURS * 3600 * 1000) {
      return;
    }

    const rows = await StockPrice.find({ stockSymbol: symbol })
      .sort({ date: -1 })
      .limit(MAX_PRICE_ROWS)
      .lean();
    if (rows.length < MIN_ROWS_FOR_PREDICTION) return;

    // ── AI MODEL CALL ──────────────────────────────────────
    const result = await ml.predictStock(
      symbol,
      rows.map((p) => ({
        date: new Date(p.date).toISOString(),
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume,
      })),
      DEFAULT_HORIZON_DAYS,
    );
    // ───────────────────────────────────────────────────────

    // same document shape as POST /stocks/:symbol/predictions creates
    await Prediction.create({
      stockSymbol: symbol,
      predictedPrice: result.predicted_price,
      modelUsed: result.model_used,
      predictionDate: new Date(),
      targetDate: new Date(result.target_date),
      horizonDays: result.horizon_days,
      confidence: result.confidence,
      direction: result.direction,
      lowerPrice: result.lower_price,
      upperPrice: result.upper_price,
      currentPrice: result.current_price,
      reliable: result.reliable,
    });
  })()
    .catch((error) => console.error(`background prediction refresh failed for ${symbol}:`, error.message))
    .finally(() => refreshing.delete(symbol));
};

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
// Get a single stock's details, plus its latest AI prediction (if any).
// Reads the stored prediction only — a GET never triggers the model.
// ────────────────────────────────────────────────────────────
const getStockBySymbol = async (req, res) => {
  try {
    const { symbol } = req.params;

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) {
      return res.status(404).json(new ApiResponse(404, "Stock not found"));
    }

    const prediction = await getLatestPrediction(stock.symbol);
    const latestPrediction = prediction
      ? { ...toForecast(prediction), isFresh: isFresh(prediction) }
      : null;

    return res
      .status(200)
      .json(new ApiResponse(200, "Stock fetched", { stock, latestPrediction }));
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
//
// Bad prices would silently corrupt the AI model, so the record is
// sanity-checked before it is stored. Query param:
//   ?refreshPrediction=true  -> after storing, refresh this stock's AI prediction in the
//                               background (only if this is the newest price). Send it on the
//                               LAST record of a batch, not on every row of a backfill.
// ────────────────────────────────────────────────────────────
const addStockPrice = async (req, res) => {
  try {

    // if (req.user.role !== "admin") {
    //   return res
    //     .status(403)
    //     .json(new ApiResponse(403, "Admin access required"));
    // }
    

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

    // ── sanity checks ───────────────────────────────────────
    const priceDate = new Date(date);
    if (isNaN(priceDate)) {
      return res.status(400).json(new ApiResponse(400, "date is not a valid date"));
    }
    const o = Number(open);
    const c = Number(close);
    const h = Number(high);
    const l = Number(low);
    const v = Number(volume);
    if (![o, c, h, l].every((n) => Number.isFinite(n) && n > 0) || !Number.isFinite(v) || v < 0) {
      return res
        .status(400)
        .json(new ApiResponse(400, "open, close, high and low must be positive numbers; volume cannot be negative"));
    }
    if (l > Math.min(o, c) || h < Math.max(o, c)) {
      return res
        .status(400)
        .json(new ApiResponse(400, "Inconsistent prices: low must be the lowest and high the highest of open/close"));
    }

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) {
      return res.status(404).json(new ApiResponse(404, "Stock not found"));
    }

    // a huge one-day move is stored but flagged: it may be a data error or an unadjusted split
    const warnings = [];
    const previous = await StockPrice.findOne({
      stockSymbol: stock.symbol,
      date: { $lt: priceDate },
    })
      .sort({ date: -1 })
      .lean();
    if (previous && previous.close > 0) {
      const movePct = (c / previous.close - 1) * 100;
      if (Math.abs(movePct) > MAX_DAILY_MOVE_PCT) {
        warnings.push(
          `Close is ${movePct.toFixed(1)}% away from the previous close — check for a data error or a stock split`,
        );
      }
    }

    // upsert — avoid duplicate rows if the pipeline retries for the same date
    const price = await StockPrice.findOneAndUpdate(
      { stockSymbol: stock.symbol, date: priceDate },
      { open: o, close: c, high: h, low: l, volume: v },
      { upsert: true, new: true },
    );

    // ── AI: keep the prediction current ─────────────────────
    let predictionRefreshRequested = false;
    if (req.query.refreshPrediction === "true") {
      const newest = await StockPrice.findOne({ stockSymbol: stock.symbol })
        .sort({ date: -1 })
        .lean();
      if (newest && new Date(newest.date).getTime() === priceDate.getTime()) {
        refreshPredictionInBackground(stock.symbol); // does not block this response
        predictionRefreshRequested = true;
      }
    }

    return res
      .status(201)
      .json(
        new ApiResponse(201, "Stock price recorded", {
          price,
          warnings,
          predictionRefreshRequested,
        }),
      );
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// GET /stocks/:symbol/chart
// Formatted time-series data ready for charting (parallel arrays,
// easy to hand straight to a charting library).
//
// Also returns `forecast`: the latest AI prediction as one extra point to draw after the last
// label (with its price range), or null when there is no current prediction.
// Pass ?forecast=false to leave it out.
// ────────────────────────────────────────────────────────────
const getStockChart = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { from, to, limit = 200, forecast: forecastParam } = req.query;

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

    // ── AI: forecast point for the chart ────────────────────
    let forecast = null;
    if (forecastParam !== "false") {
      const prediction = await getLatestPrediction(stock.symbol);
      if (prediction && isFresh(prediction)) {
        forecast = {
          ...toForecast(prediction),
          label: prediction.targetDate
            ? new Date(prediction.targetDate).toISOString().slice(0, 10)
            : null,
        };
      }
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Chart data fetched", {
          symbol: stock.symbol,
          chart,
          forecast,
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