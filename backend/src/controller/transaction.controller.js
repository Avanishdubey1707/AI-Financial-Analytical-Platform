const Transaction = require("../models/transaction.model");
const ApiResponse = require("../utils/ApiResponse");
const User = require("../models/user.model");
const mongoose = require('mongoose')
const FraudAlert = require('../models/fraudAlert.model')

const addTransaction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, amount, category, description } = req.body;
    if ((!type || !amount, !category)) {
      return res
        .status(400)
        .json(new ApiResponse(400, "All fields are required"));
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiResponse(404, "User not found"));
    }

    const transactions = await Transaction.create({
      userId,
      type,
      amount,
      category,
      description,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, "Transaction created successfully", transactions),
      );
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, `Internal server error ${error.message}`));
  }
};

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

    // always scope to the logged-in user — never trust a userId from the query
    const filter = { userId: req.user._id };

    if (type) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    // date range filter
    if (from || to) {
      filter.date = {};
      if (from) {
        const fromDate = new Date(from);
        if (isNaN(fromDate)) {
          return res
            .status(400)
            .json(new ApiResponse(400, "Invalid 'from' date"));
        }
        filter.date.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (isNaN(toDate)) {
          return res
            .status(400)
            .json(new ApiResponse(400, "Invalid 'to' date"));
        }
        filter.date.$lte = toDate;
      }
    }

    // amount range filter
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    // partial text search on description
    if (search) {
      filter.description = { $regex: search, $options: "i" };
    }

    // whitelist sortable fields to avoid arbitrary field injection
    const allowedSortFields = ["date", "amount", "category", "type"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "date";
    const sortOrder = order === "asc" ? 1 : -1;

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100); // cap at 100
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(200, "Transactions fetched", {
        transactions,
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

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    if (!id || !userId) {
      return res.status(400).json(400, "Id is required");
    }
    const transaction = await Transaction.findOne({
      userId,
      _id: id,
    });
    if (!transaction) {
      return res
        .status(404)
        .json(new ApiResponse(404, "Transaction not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Transaction fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

const updateTransactionDetails = async (req, res) => {
  const { category, amount, description } = req.body;
  if (!category && !amount && !description) {
    return res
      .status(400)
      .json(new ApiResponse(400, "At least one field required"));
  }
  try {
    const { id } = req.params;
    const transaction = await Transaction.findOneAndUpdate(
      {
        _id: id,
        userId: req.user._id,
      },
      {
        category,
        amount,
        description,
      },
    );
    if(!transaction){
        return res.status(404).json(new ApiResponse(404, "Transaction not found"))
    }
    return res.status(200).json(new ApiResponse(200, "Transaction updated successfully"))
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, "Internal server error"))
  }

};

const deleteTransaction = async(req, res) => {
    try {
        const {id} = req.params
        const transaction = await Transaction.findOneAndDelete(
            {
                _id: id, userId: req.user._id
            },

        )
        return res.status(200).json(new ApiResponse(200, "Transaction deleted successfully"))

    } catch (error) {
        return res.status(500).json(new ApiResponse(500, "Internal server error"))
    }
}

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
 
    // group by year-month + category, sum amounts, count transactions
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
 
    // also compute a simple overall total (income vs expense) for convenience
    const overall = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
        },
      },
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
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};
 
// ────────────────────────────────────────────────────────────
// POST /transactions/:id/check-fraud
// Manually (re-)trigger fraud scoring on a transaction.
// Internal/admin use — gated by role check.
// ────────────────────────────────────────────────────────────
const checkFraud = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json(new ApiResponse(403, "Admin access required"));
    }
 
    const { id } = req.params;
    const transaction = await Transaction.findById(id);
 
    if (!transaction) {
      return res
        .status(404)
        .json(new ApiResponse(404, "Transaction not found"));
    }
 
    const riskScore = await computeFraudScore(transaction);
    const status = riskScore >= 0.7 ? "flagged" : "cleared";
 
    // upsert: update the existing alert for this transaction, or create one
    const fraudAlert = await FraudAlert.findOneAndUpdate(
      { transactionId: transaction._id },
      { riskScore, status, createdAt: new Date() },
      { upsert: true, new: true },
    );
 
    return res
      .status(200)
      .json(new ApiResponse(200, "Fraud check completed", { fraudAlert }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};
 
const computeFraudScore = async (transaction) => {
  let score = 0;
 
  if (transaction.amount > 100000) score += 0.4;
  if (transaction.type === "expense" && transaction.amount > 50000) score += 0.2;
 
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
  checkFraud,
};
 
