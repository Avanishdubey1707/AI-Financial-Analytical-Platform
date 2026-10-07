const fs = require("fs");
const path = require("path");
const Report = require("../models/report.model");
const Portfolio = require("../models/portfolio.model");
const Holding = require("../models/stocksModel/Holding.model");
const Transaction = require("../models/transaction.model");
const FraudAlert = require("../models/fraudAlert.model");
// adjust these three paths to where your models actually live
const Prediction = require("../models/stocksModel/prediction.model");
const StockPrice = require("../models/stocksModel/stockPrice.model");
const ExpenseForecast = require("../models/expenseForecast.model");
const ApiResponse = require("../utils/ApiResponse");
const ml = require("../utils/mlClient");

const ALLOWED_TYPES = ["portfolio_summary", "tax", "expense", "fraud"];

// where generated files live before/after upload — adjust to your setup
const REPORTS_DIR = path.join(__dirname, "..", "storage", "reports");

// ── prediction settings ─────────────────────────────────────
const DEFAULT_HORIZON_DAYS = 5;
const MAX_FRESH_PREDICTIONS = 5; // cap on-the-fly model runs per report so it can't take forever
const MAX_PRICE_ROWS = 1500;
const DAY_MS = 24 * 60 * 60 * 1000;
const PREDICTION_DISCLAIMER =
  "Predictions are statistical estimates produced by a machine-learning model. They are not financial advice and can be wrong.";

// ────────────────────────────────────────────────────────────
// GET /reports
// ────────────────────────────────────────────────────────────
const getAllReports = async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;

    const filter = { userId: req.user.id };
    if (type) filter.type = type;

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [reports, total] = await Promise.all([
      Report.find(filter).sort({ generatedAt: -1 }).skip(skip).limit(limitNum),
      Report.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(200, "Reports fetched", {
        reports,
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
// POST /reports/generate
// Body: { type: "portfolio_summary" | "tax" | "expense" | "fraud", from?, to? }
// ────────────────────────────────────────────────────────────
const generateReport = async (req, res) => {
  try {
    const { type, from, to } = req.body;

    if (!type || !ALLOWED_TYPES.includes(type)) {
      return res
        .status(400)
        .json(new ApiResponse(400, `type must be one of: ${ALLOWED_TYPES.join(", ")}`));
    }

    // 1. gather the raw data this report type needs (includes AI predictions)
    const reportData = await buildReportData(type, req.user.id, { from, to });

    // 2. produce the report file
    const { fileUrl } = await renderReportFile(type, reportData, req.user.id);

    const report = await Report.create({
      userId: req.user.id,
      type,
      generatedAt: new Date(),
      fileUrl,
    });

    return res.status(201).json(new ApiResponse(201, "Report generated", { report }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ════════════════════════════════════════════════════════════
// PREDICTION HELPERS
// A report must never fail just because the AI service is down, so every
// ML call below is best-effort: on failure the report is still produced and
// lists what could not be predicted.
// ════════════════════════════════════════════════════════════

// confidence may be stored as 0-1 or 0-100; reports always show 0-1
const normalizeConfidence = (c) => {
  const n = Number(c);
  if (!Number.isFinite(n)) return null;
  return Math.min(Math.max(n > 1 ? n / 100 : n, 0), 1);
};

// a stored prediction is "fresh" until its target date passes (or 7 days if it has none)
const isFresh = (p, now) => {
  if (p.targetDate) return new Date(p.targetDate) >= now;
  return (now - new Date(p.predictionDate)) / DAY_MS <= 7;
};

// shape of a prediction stored in YOUR Prediction collection -> report shape
const fromStored = (p) => ({
  stockSymbol: p.stockSymbol,
  predictedPrice: p.predictedPrice,
  confidence: normalizeConfidence(p.confidence),
  predictionDate: p.predictionDate,
  targetDate: p.targetDate ?? null,
  modelUsed: p.modelUsed ?? null,
  source: "stored",
});

// shape returned by the Python service -> report shape
const fromService = (r) => ({
  stockSymbol: r.stock_symbol,
  predictedPrice: r.predicted_price,
  lowerPrice: r.lower_price,
  upperPrice: r.upper_price,
  direction: r.direction,
  confidence: r.confidence,
  reliable: r.reliable,
  predictionDate: r.prediction_date,
  targetDate: r.target_date,
  modelUsed: r.model_used,
  source: "generated",
});

const getLatestPrices = async (symbols) => {
  const rows = await StockPrice.aggregate([
    { $match: { stockSymbol: { $in: symbols } } },
    { $sort: { date: -1 } },
    { $group: { _id: "$stockSymbol", close: { $first: "$close" } } },
  ]);
  return new Map(rows.map((r) => [r._id, r.close]));
};

/**
 * Latest prediction per symbol:
 *   1. use the stored prediction if it is still fresh
 *   2. otherwise ask the ML service for a new one (max MAX_FRESH_PREDICTIONS per report)
 *   3. if that fails, fall back to the stale stored prediction (flagged stale: true)
 * Returns { predictions: Map(symbol -> prediction), unavailable: [{stockSymbol, reason}] }
 */
const getPredictionsForSymbols = async (symbols) => {
  const now = new Date();
  const predictions = new Map();
  const unavailable = [];

  const storedRows = await Prediction.aggregate([
    { $match: { stockSymbol: { $in: symbols } } },
    { $sort: { predictionDate: -1 } },
    { $group: { _id: "$stockSymbol", prediction: { $first: "$$ROOT" } } },
    { $replaceRoot: { newRoot: "$prediction" } },
  ]);
  const storedMap = new Map(storedRows.map((p) => [p.stockSymbol, p]));

  const needFresh = [];
  for (const sym of symbols) {
    const p = storedMap.get(sym);
    if (p && Number.isFinite(p.predictedPrice) && isFresh(p, now)) {
      predictions.set(sym, fromStored(p));
    } else {
      needFresh.push(sym);
    }
  }

  const toGenerate = needFresh.slice(0, MAX_FRESH_PREDICTIONS);
  const settled = await Promise.allSettled(
    toGenerate.map(async (sym) => {
      const rows = await StockPrice.find({ stockSymbol: sym })
        .sort({ date: -1 })
        .limit(MAX_PRICE_ROWS)
        .lean();
      if (rows.length === 0) throw new Error("no price history");
      const prices = rows.map((r) => ({
        date: new Date(r.date).toISOString(),
        open: r.open,
        high: r.high,
        low: r.low,
        close: r.close,
        volume: r.volume,
      }));
      // ── AI MODEL CALL ────────────────────────────────────
      return ml.predictStock(sym, prices, DEFAULT_HORIZON_DAYS);
      // ─────────────────────────────────────────────────────
    }),
  );

  settled.forEach((s, i) => {
    const sym = toGenerate[i];
    if (s.status === "fulfilled") {
      predictions.set(sym, fromService(s.value));
      return;
    }
    const old = storedMap.get(sym);
    if (old && Number.isFinite(old.predictedPrice)) {
      predictions.set(sym, { ...fromStored(old), stale: true });
    } else {
      unavailable.push({ stockSymbol: sym, reason: s.reason?.message || "prediction failed" });
    }
  });

  // symbols beyond the per-report cap
  for (const sym of needFresh.slice(MAX_FRESH_PREDICTIONS)) {
    const old = storedMap.get(sym);
    if (old && Number.isFinite(old.predictedPrice)) {
      predictions.set(sym, { ...fromStored(old), stale: true });
    } else {
      unavailable.push({ stockSymbol: sym, reason: "skipped: too many stocks for one report" });
    }
  }

  return { predictions, unavailable };
};

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Pulls together whatever data a given report type needs.
 */
const buildReportData = async (type, userId, { from, to }) => {
  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) dateFilter.$lte = new Date(to);

  switch (type) {
    case "portfolio_summary": {
      const portfolioIds = await Portfolio.find({ userId }).distinct("_id");
      const holdings = await Holding.find({ portfolioId: { $in: portfolioIds } }).lean();
      const symbols = [...new Set(holdings.map((h) => h.stockSymbol))];

      const [priceMap, { predictions, unavailable }] = await Promise.all([
        getLatestPrices(symbols),
        getPredictionsForSymbols(symbols),
      ]);

      let totalCost = 0;
      let totalMarketValue = 0;
      let coveredMarketValue = 0; // only holdings that have BOTH a price and a prediction,
      let coveredExpectedValue = 0; // so the expected change compares like with like
      let covered = 0;

      const rows = holdings.map((h) => {
        const price = priceMap.get(h.stockSymbol) ?? null;
        const prediction = predictions.get(h.stockSymbol) ?? null;
        const cost = h.quantity * h.avgPrice;
        const marketValue = price != null ? price * h.quantity : null;
        const expectedValue = prediction ? prediction.predictedPrice * h.quantity : null;

        totalCost += cost;
        if (marketValue != null) totalMarketValue += marketValue;
        if (marketValue != null && expectedValue != null) {
          covered++;
          coveredMarketValue += marketValue;
          coveredExpectedValue += expectedValue;
        }

        return {
          ...h,
          currentPrice: price,
          marketValue: marketValue != null ? round2(marketValue) : null,
          unrealizedPnl: marketValue != null ? round2(marketValue - cost) : null,
          prediction,
          expectedValueAtTarget: expectedValue != null ? round2(expectedValue) : null,
        };
      });

      return {
        holdings: rows,
        summary: {
          totalCost: round2(totalCost),
          totalMarketValue: round2(totalMarketValue),
          unrealizedPnl: round2(totalMarketValue - totalCost),
          holdingsWithPrediction: covered,
          totalHoldings: rows.length,
          expectedChangePct:
            coveredMarketValue > 0
              ? round2((coveredExpectedValue / coveredMarketValue - 1) * 100)
              : null,
        },
        predictionsUnavailable: unavailable,
        disclaimer: PREDICTION_DISCLAIMER,
      };
    }

    case "tax": {
      const filter = { userId };
      if (from || to) filter.date = dateFilter;
      const transactions = await Transaction.find(filter).sort({ date: 1 }).lean();
      return { transactions };
    }

    case "expense": {
      const filter = { userId };
      if (from || to) filter.date = dateFilter;
      const transactions = await Transaction.find(filter).sort({ date: 1 }).lean();

      // forecasts created earlier by POST /expense-forecasts/generate
      const currentMonth = new Date().toISOString().slice(0, 7);
      const forecasts = await ExpenseForecast.find({ userId, month: { $gte: currentMonth } })
        .sort({ month: 1 })
        .lean();

      const totalsByMonth = {};
      for (const f of forecasts) {
        totalsByMonth[f.month] = round2((totalsByMonth[f.month] || 0) + f.predictedAmount);
      }

      return {
        transactions,
        forecasts: forecasts.map((f) => ({
          month: f.month,
          category: f.category,
          predictedAmount: f.predictedAmount,
        })),
        forecastTotalsByMonth: totalsByMonth,
        disclaimer: PREDICTION_DISCLAIMER,
      };
    }

    case "fraud": {
      const transactionIds = await Transaction.find({ userId }).distinct("_id");
      const alerts = await FraudAlert.find({ transactionId: { $in: transactionIds } }).lean();

      const byStatus = {};
      for (const a of alerts) byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      const scores = alerts.map((a) => a.riskScore).filter((s) => Number.isFinite(s));

      return {
        alerts,
        summary: {
          totalAlerts: alerts.length,
          byStatus,
          highestRiskScore: scores.length ? Math.max(...scores) : null,
          averageRiskScore: scores.length
            ? round2(scores.reduce((a, b) => a + b, 0) / scores.length)
            : null,
        },
      };
    }

    default:
      return {};
  }
};

/**
 * ── PLACEHOLDER — REPLACE WITH YOUR REAL FILE-GENERATION LOGIC ──
 * Until wired up, this stub writes a JSON snapshot to local disk so the
 * download endpoint has something real to serve end-to-end. For a PDF, render
 * reportData with pdfkit/puppeteer and upload to S3.
 */
const renderReportFile = async (type, reportData, userId) => {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const fileName = `${type}_${userId}_${Date.now()}.json`;
  const filePath = path.join(REPORTS_DIR, fileName);

  const snapshot = { type, generatedAt: new Date().toISOString(), ...reportData };
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));

  // fileUrl stored on the Report doc — swap for an S3/CDN URL in production
  return { fileUrl: `/reports/files/${fileName}` };
};

// ────────────────────────────────────────────────────────────
// GET /reports/:id
// ────────────────────────────────────────────────────────────
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json(new ApiResponse(404, "Report not found"));
    }

    if (report.userId.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json(new ApiResponse(403, "You do not have access to this report"));
    }

    return res.status(200).json(new ApiResponse(200, "Report fetched", { report }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// GET /reports/:id/download
// ────────────────────────────────────────────────────────────
const downloadReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json(new ApiResponse(404, "Report not found"));
    }

    if (report.userId.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json(new ApiResponse(403, "You do not have access to this report"));
    }

    // if fileUrl points elsewhere (S3/CDN), redirect instead of streaming locally
    if (/^https?:\/\//.test(report.fileUrl)) {
      return res.redirect(report.fileUrl);
    }

    const fileName = path.basename(report.fileUrl);
    const filePath = path.join(REPORTS_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json(new ApiResponse(404, "Report file is missing from storage"));
    }

    return res.download(filePath, fileName);
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// DELETE /reports/:id
// ────────────────────────────────────────────────────────────
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json(new ApiResponse(404, "Report not found"));
    }

    if (report.userId.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json(new ApiResponse(403, "You do not have access to this report"));
    }

    if (!/^https?:\/\//.test(report.fileUrl)) {
      const fileName = path.basename(report.fileUrl);
      const filePath = path.join(REPORTS_DIR, fileName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    // if using S3/CDN, delete the remote object here instead

    await report.deleteOne();

    return res.status(200).json(new ApiResponse(200, "Report deleted"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

module.exports = {
  getAllReports,
  generateReport,
  getReportById,
  downloadReport,
  deleteReport,
};