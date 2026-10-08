const Transaction = require("../models/transaction.model");
const ApiResponse = require("../utils/ApiResponse");
const User = require("../models/user.model");
const mongoose = require("mongoose");
const FraudAlert = require("../models/fraudAlert.model");
const ml = require("../utils/mlClient");

// ── fraud-scoring settings ──────────────────────────────────
const FLAG_THRESHOLD = 0.4; // riskScore >= 0.4  -> a FraudAlert is created
const HIGH_RISK_THRESHOLD = 0.7; // riskScore >= 0.7  -> status "CONFIRMED" (same rule as before)
// Statuses this code assigns by itself (same two values as your original checkFraud).
// Any OTHER status (e.g. REVIEWED / DISMISSED) is a human decision and is never changed by a re-check.
const AUTO_STATUSES = ["PENDING", "CONFIRMED"];
const HISTORY_LIMIT = 1000; // how many past transactions the model looks at
const FRAUD_ML_TIMEOUT_MS = 5000; // POST /transactions must stay fast; after this we use the rules
// Dates are stored in UTC, but "late at night" must be judged in the user's local time.
// 330 = India (IST, UTC+5:30). Change via env var if your users are elsewhere.
const LOCAL_UTC_OFFSET_MINUTES = Number(process.env.FRAUD_TZ_OFFSET_MINUTES ?? 330);

// ────────────────────────────────────────────────────────────
// POST /transactions
// Creates a transaction, then runs fraud scoring on it immediately.
// ────────────────────────────────────────────────────────────
const addTransaction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, amount, category, description } = req.body;

    if (!type || amount == null || !category) {
      return res
        .status(400)
        .json(new ApiResponse(400, "type, amount and category are required"));
    }
    if (amount <= 0) {
      return res
        .status(400)
        .json(new ApiResponse(400, "amount must be a positive number"));
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiResponse(404, "User not found"));
    }

    const transaction = await Transaction.create({
      userId,
      type,
      amount,
      category,
      description,
    });

    // fraud check on every new transaction. The transaction is already saved,
    // so a failure here must never turn the response into a 500.
    let fraudAlert = null;
    try {
      fraudAlert = await checkFraud(transaction); // null when the transaction looks normal
    } catch (fraudError) {
      console.error(`fraud check failed for transaction ${transaction._id}:`, fraudError);
    }

    return res.status(201).json(
      new ApiResponse(201, "Transaction created successfully", {
        transaction,
        fraudAlert,
      }),
    );
  } catch (error) {
    console.error("addTransaction error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, `Internal server error: ${error.message}`));
  }
};

// ────────────────────────────────────────────────────────────
// GET /transactions
// Filtering/sorting/pagination, plus each transaction's existing
// fraud alert (if any) attached — no recomputation on read.
// ────────────────────────────────────────────────────────────
const getAllTransactions = async (req, res) => {
  try {
    const {
      type,
      category,
      from,
      to,
      minAmount,
      maxAmount,
      search,
      sortBy = "date",
      order = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { userId: req.user._id };

    if (type) filter.type = type;
    if (category) filter.category = category;

    if (from || to) {
      filter.date = {};
      if (from) {
        const fromDate = new Date(from);
        if (isNaN(fromDate)) {
          return res.status(400).json(new ApiResponse(400, "Invalid 'from' date"));
        }
        filter.date.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (isNaN(toDate)) {
          return res.status(400).json(new ApiResponse(400, "Invalid 'to' date"));
        }
        filter.date.$lte = toDate;
      }
    }

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    if (search) {
      filter.description = { $regex: search, $options: "i" };
    }

    const allowedSortFields = ["date", "amount", "category", "type"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "date";
    const sortOrder = order === "asc" ? 1 : -1;

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(filter),
    ]);

    // attach existing fraud alerts in one query instead of N lookups
    const transactionIds = transactions.map((t) => t._id);
    const alerts = await FraudAlert.find({ transactionId: { $in: transactionIds } });
    const alertMap = new Map(alerts.map((a) => [a.transactionId.toString(), a]));

    const transactionsWithAlerts = transactions.map((t) => ({
      ...t.toObject(),
      fraudAlert: alertMap.get(t._id.toString()) || null,
    }));

    return res.status(200).json(
      new ApiResponse(200, "Transactions fetched", {
        transactions: transactionsWithAlerts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      }),
    );
  } catch (error) {
    console.error("getAllTransactions error:", error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// GET /transactions/:id
// ────────────────────────────────────────────────────────────
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const transaction = await Transaction.findOne({ userId, _id: id });
    if (!transaction) {
      return res.status(404).json(new ApiResponse(404, "Transaction not found"));
    }

    // attach the existing fraud alert, if one exists — don't recompute here
    const fraudAlert = await FraudAlert.findOne({ transactionId: transaction._id });

    return res.status(200).json(
      new ApiResponse(200, "Transaction fetched successfully", {
        transaction,
        fraudAlert: fraudAlert || null,
      }),
    );
  } catch (error) {
    console.error("getTransactionById error:", error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// PUT /transactions/:id
// Uses findOneAndUpdate() with $set so only the provided fields change.
//
// Fraud scoring is re-run when amount OR category changed: the model judges
// a transaction against the user's usual spend IN THAT CATEGORY, so both
// fields affect the risk. Description-only edits don't need a re-score.
// ────────────────────────────────────────────────────────────
const updateTransactionDetails = async (req, res) => {
  const { category, amount, description } = req.body;

  if (category == null && amount == null && description == null) {
    return res
      .status(400)
      .json(new ApiResponse(400, "At least one field required"));
  }
  if (amount != null && amount <= 0) {
    return res
      .status(400)
      .json(new ApiResponse(400, "amount must be a positive number"));
  }

  try {
    const { id } = req.params;

    const updateFields = {};
    if (category != null) updateFields.category = category;
    if (amount != null) updateFields.amount = amount;
    if (description != null) updateFields.description = description;

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: updateFields },
      { new: true, runValidators: true },
    );

    if (!transaction) {
      return res.status(404).json(new ApiResponse(404, "Transaction not found"));
    }

    let fraudAlert = null;
    if (amount != null || category != null) {
      try {
        fraudAlert = await checkFraud(transaction);
      } catch (fraudError) {
        console.error(`fraud re-check failed for transaction ${transaction._id}:`, fraudError);
        fraudAlert = await FraudAlert.findOne({ transactionId: transaction._id });
      }
    } else {
      fraudAlert = await FraudAlert.findOne({ transactionId: transaction._id });
    }

    return res.status(200).json(
      new ApiResponse(200, "Transaction updated successfully", {
        transaction,
        fraudAlert,
      }),
    );
  } catch (error) {
    console.error("updateTransactionDetails error:", error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// DELETE /transactions/:id
// Also removes the linked fraud alert, if any.
// ────────────────────────────────────────────────────────────
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json(new ApiResponse(404, "Transaction not found"));
    }

    await FraudAlert.deleteOne({ transactionId: transaction._id });

    return res.status(200).json(new ApiResponse(200, "Transaction deleted successfully"));
  } catch (error) {
    console.error("deleteTransaction error:", error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// GET /transactions/summary — unchanged
// ────────────────────────────────────────────────────────────
const getTransactionSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const match = { userId };
    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = new Date(from);
      if (to) match.date.$lte = new Date(to);
    }

    const summary = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            category: "$category",
            type: "$type",
          },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          category: "$_id.category",
          type: "$_id.type",
          totalAmount: 1,
          count: 1,
        },
      },
      { $sort: { year: -1, month: -1, totalAmount: -1 } },
    ]);

    const overall = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: "$type", totalAmount: { $sum: "$amount" } } },
    ]);

    const overallTotals = overall.reduce((acc, row) => {
      acc[row._id] = row.totalAmount;
      return acc;
    }, {});

    return res.status(200).json(
      new ApiResponse(200, "Transaction summary fetched", {
        byCategoryAndMonth: summary,
        overallTotals,
      }),
    );
  } catch (error) {
    console.error("getTransactionSummary ERROR:", error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// POST /transactions/:id/check-fraud
// Manually (re-)trigger fraud scoring on a transaction — internal/admin use.
// ────────────────────────────────────────────────────────────
const checkFraudEndpoint = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json(new ApiResponse(403, "Admin access required"));
    }

    const { id } = req.params;
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json(new ApiResponse(404, "Transaction not found"));
    }

    const fraudAlert = await checkFraud(transaction);

    return res.status(200).json(
      new ApiResponse(
        200,
        fraudAlert ? "Fraud check completed" : "Fraud check completed — no risk detected",
        { fraudAlert },
      ),
    );
  } catch (error) {
    console.error("checkFraudEndpoint error:", error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ════════════════════════════════════════════════════════════
// FRAUD SCORING
// ════════════════════════════════════════════════════════════

/**
 * Core fraud-scoring logic — shared by addTransaction, updateTransactionDetails,
 * and the manual check-fraud endpoint.
 *
 *  - risk below FLAG_THRESHOLD  -> no alert. An automatic alert (PENDING / CONFIRMED) left over from
 *                                  an earlier, riskier version of the transaction is removed.
 *  - risk at/above it           -> one FraudAlert per transaction, created or refreshed; its status
 *                                  is recomputed from the score, exactly as your original code did.
 *
 * Alerts with any other status (a human marked them REVIEWED / DISMISSED ...) are never overwritten.
 * Returns the FraudAlert document, or null when the transaction looks normal.
 */
const checkFraud = async (transaction) => {
  if (!transaction) {
    throw new Error("Transaction not found");
  }

  const { riskScore, reasons, modelUsed } = await getFraudScore(transaction);

  if (riskScore < FLAG_THRESHOLD) {
    await FraudAlert.deleteOne({ transactionId: transaction._id, status: { $in: AUTO_STATUSES } });
    return FraudAlert.findOne({ transactionId: transaction._id }); // null, or a human-reviewed alert
  }

  const autoStatus = riskScore >= HIGH_RISK_THRESHOLD ? "CONFIRMED" : "PENDING";

  const existing = await FraudAlert.findOne({ transactionId: transaction._id });
  if (existing) {
    existing.riskScore = riskScore;
    existing.reasons = reasons; // add `reasons` and `modelUsed` to your FraudAlert schema,
    existing.modelUsed = modelUsed; // otherwise Mongoose silently ignores them
    if (AUTO_STATUSES.includes(existing.status)) existing.status = autoStatus;
    await existing.save();
    return existing;
  }

  return FraudAlert.create({
    transactionId: transaction._id,
    riskScore,
    status: autoStatus,
    reasons,
    modelUsed,
  });
};

/**
 * Returns { riskScore (0-1), reasons: string[], modelUsed }.
 * Tries the ML service first; if it is down, slow or errors, falls back to the
 * simple rules so every transaction still gets scored.
 */
const getFraudScore = async (transaction) => {
  try {
    // Compare against the user's earlier transactions of the SAME type. Mixing in income
    // (e.g. a salary credit) would distort what "normal" spending looks like.
    const history = await Transaction.find({
      userId: transaction.userId,
      type: transaction.type,
      _id: { $ne: transaction._id },
      date: { $lte: transaction.date },
    })
      .sort({ date: -1 })
      .limit(HISTORY_LIMIT)
      .lean();

    // ── AI MODEL CALL ────────────────────────────────────────
    const result = await withTimeout(
      ml.scoreFraud(toMlTransaction(transaction), history.map(toMlTransaction)),
      FRAUD_ML_TIMEOUT_MS,
    );
    // ─────────────────────────────────────────────────────────

    return {
      riskScore: Math.round((result.risk_score / 100) * 1000) / 1000, // service: 0-100 -> yours: 0-1
      reasons: result.reasons,
      modelUsed: result.model_used,
    };
  } catch (error) {
    console.error(`ML fraud scoring unavailable, using rule-based fallback: ${error.message}`);
    const { score, reasons } = computeFraudScoreFallback(transaction);
    return { riskScore: score, reasons, modelUsed: "rules_fallback" };
  }
};

// shape one transaction the way the Python service expects it
const toMlTransaction = (t) => ({
  id: String(t._id),
  amount: t.amount,
  date: toLocalWallClockIso(t.date),
  category: t.category,
  type: t.type,
});

// shift UTC -> user's local wall-clock time so "02:30 at night" really means night for the user
const toLocalWallClockIso = (date) =>
  new Date(new Date(date).getTime() + LOCAL_UTC_OFFSET_MINUTES * 60 * 1000).toISOString();

const withTimeout = (promise, ms) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

/**
 * Your original rule-based scoring, kept as the safety net for when the ML
 * service cannot be reached.
 */
const computeFraudScoreFallback = (transaction) => {
  let score = 0;
  const reasons = [];

  if (transaction.amount > 100000) {
    score += 0.4;
    reasons.push("Amount is above 1,00,000");
  }
  if (transaction.type === "expense" && transaction.amount > 50000) {
    score += 0.5;
    reasons.push("Expense above 50,000");
  }

  return { score: Math.min(score, 1), reasons };
};

module.exports = {
  addTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransactionDetails,
  deleteTransaction,
  getTransactionSummary,
  checkFraudEndpoint,
  checkFraud,
};