const fs = require("fs");
const path = require("path");
const Report = require("../models/report.model");
const Portfolio = require("../models/portfolio.model");
const Holding = require("../models/stocksModel/Holding.model");
const Transaction = require("../models/transaction.model");
const FraudAlert = require("../models/fraudAlert.model");
const ApiResponse = require("../utils/ApiResponse");

const ALLOWED_TYPES = ["portfolio_summary", "tax", "expense", "fraud"];

// where generated files live before/after upload — adjust to your setup
const REPORTS_DIR = path.join(__dirname, "..", "storage", "reports");

// ────────────────────────────────────────────────────────────
// GET /reports
// List all reports generated for the logged-in user.
// Query params: type, page, limit
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
// Generate a new report for the logged-in user.
// Body: { type: "portfolio_summary" | "tax" | "expense" | "fraud",
//         from?, to? }  // optional date range, used by some report types
// ────────────────────────────────────────────────────────────
const generateReport = async (req, res) => {
  try {
    const { type, from, to } = req.body;

    if (!type || !ALLOWED_TYPES.includes(type)) {
      return res
        .status(400)
        .json(new ApiResponse(400, `type must be one of: ${ALLOWED_TYPES.join(", ")}`));
    }

    // 1. gather the raw data this report type needs
    const reportData = await buildReportData(type, req.user.id, { from, to });

    // ── FILE / AI GENERATION CALL ────────────────────────────
    // This is the single place the report file itself gets produced.
    // Swap renderReportFile()'s internals for whatever you actually use:
    // a PDF library (pdfkit/puppeteer), a call to an LLM to write a
    // narrative summary, or a report-generation microservice.
    const { fileUrl } = await renderReportFile(type, reportData, req.user.id);
    // ─────────────────────────────────────────────────────────

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

/**
 * Pulls together whatever data a given report type needs.
 * Kept separate from rendering so the "what data" and "how it's
 * turned into a file" concerns don't get tangled together.
 */
const buildReportData = async (type, userId, { from, to }) => {
  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) dateFilter.$lte = new Date(to);

  switch (type) {
    case "portfolio_summary": {
      const portfolioIds = await Portfolio.find({ userId }).distinct("_id");
      const holdings = await Holding.find({ portfolioId: { $in: portfolioIds } });
      return { holdings };
    }

    case "tax":
    case "expense": {
      const filter = { userId };
      if (from || to) filter.date = dateFilter;
      const transactions = await Transaction.find(filter).sort({ date: 1 });
      return { transactions };
    }

    case "fraud": {
      const transactionIds = await Transaction.find({ userId }).distinct("_id");
      const alerts = await FraudAlert.find({ transactionId: { $in: transactionIds } });
      return { alerts };
    }

    default:
      return {};
  }
};

/**
 * ── PLACEHOLDER — REPLACE WITH YOUR REAL FILE-GENERATION LOGIC ──
 *
 * Input:  type       -> report type
 *         reportData -> whatever buildReportData() returned
 *         userId     -> for namespacing the output file
 *
 * Output: { fileUrl } -> a URL/path the client can later download from
 *
 * Real integration options:
 *   - PDF: use `pdfkit` or `puppeteer` to render reportData into a PDF,
 *     then upload to S3 and return the public/signed URL.
 *   - AI-written summary: send reportData to an LLM to produce a
 *     narrative report, then render that text into the PDF/HTML.
 *   - Delegate entirely: POST reportData to an external report service
 *     and use the URL it returns.
 *
 * Until wired up, this stub writes a JSON snapshot to local disk so the
 * download endpoint has something real to serve end-to-end.
 */
const renderReportFile = async (type, reportData, userId) => {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const fileName = `${type}_${userId}_${Date.now()}.json`;
  const filePath = path.join(REPORTS_DIR, fileName);

  fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2));

  // fileUrl stored on the Report doc — swap for an S3/CDN URL in production
  return { fileUrl: `/reports/files/${fileName}` };
};

// ────────────────────────────────────────────────────────────
// GET /reports/:id
// Get report metadata.
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
// Stream/download the actual report file.
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
// Delete a report (metadata + underlying file, if local).
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