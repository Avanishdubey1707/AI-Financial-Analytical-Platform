const Transaction = require("../models/transaction.model");
const ApiResponse = require("../utils/ApiResponse");
const User = require("../models/user.model");
const mongoose = require("mongoose");
const FraudAlert = require("../models/fraudAlert.model");

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

    // fraud check on every new transaction
    const fraudAlert = await checkFraud(transaction);

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
// Filtering/sorting/pagination, same as before, plus each transaction's
// existing fraud alert (if any) attached — no recomputation on read.
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
// Fixed: the old `.json(400, "Id is required")` call was buggy —
// .json() only takes one argument, so the message was silently dropped.
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
// Fixed: was using findOneAndReplace(), which REPLACES the entire
// document with only {category, amount, description} — this would
// silently wipe out userId, type, and date on every update (and would
// likely throw a validation error if those fields are `required` in
// your schema). Switched to findOneAndUpdate() with $set, which only
// touches the fields actually provided.
//
// Also re-runs fraud scoring, since amount is exactly the field that
// determines fraud risk — an update that changes amount from ₹500 to
// ₹5,00,000 should re-trigger a check.
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

    // re-run fraud scoring only if amount changed — category/description
    // edits don't affect risk, so no need to re-score on every edit
    let fraudAlert = null;
    if (amount != null) {
      fraudAlert = await checkFraud(transaction);
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
// Also removes the linked fraud alert, if any, to avoid leaving an
// orphaned FraudAlert row pointing at a transaction that no longer exists.
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
// GET /transactions/summary — unchanged from before
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

    return res
      .status(200)
      .json(new ApiResponse(200, "Fraud check completed", { fraudAlert }));
  } catch (error) {
    console.error("checkFraudEndpoint error:", error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

/**
 * Core fraud-scoring logic — shared by addTransaction, updateTransactionDetails,
 * and the manual check-fraud endpoint. Upserts so a transaction only ever has
 * one FraudAlert row, which gets refreshed rather than duplicated on re-checks.
 */
const checkFraud = async (transaction) => {
  if (!transaction) {
    throw new Error("Transaction not found");
  }

  const riskScore = await computeFraudScore(transaction);
  const status = riskScore >= 0.7 ? "CONFIRMED" : "PENDING";

  const fraudAlert = await FraudAlert.findOneAndUpdate(
    { transactionId: transaction._id },
    { riskScore, status },
    { upsert: true, new: true, runValidators: true },
  );

  return fraudAlert;
};

const computeFraudScore = async (transaction) => {
  let score = 0;

  if (transaction.amount > 100000) score += 0.4;
  if (transaction.type === "expense" && transaction.amount > 50000) score += 0.5;

  // e.g. flag transactions made at unusual hours, rapid repeats, etc.
  // this is where you'd call out to an actual ML model/service

  return Math.min(score, 1);
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