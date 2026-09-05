const Transaction = require("../models/transaction.model");
const FraudAlert = require("../models/fraudAlert.model");
const ApiResponse = require("../utils/ApiResponse");

const ALLOWED_STATUSES = ['PENDING', 'REVIEWED', 'CONFIRMED', DISMISSED];

/**
 * FraudAlert only stores transactionId, not userId directly (per the ERD),
 * so "does this alert belong to the logged-in user" has to be answered
 * by checking the transaction it points to.
 */
const findOwnedAlertOrRespond = async (req, res) => {
  const { id } = req.params;

  const alert = await FraudAlert.findById(id);
  if (!alert) {
    res.status(404).json(new ApiResponse(404, "Fraud alert not found"));
    return null;
  }

  const transaction = await Transaction.findById(alert.transactionId);
  if (
    !transaction ||
    transaction.userId.toString() !== req.user._id.toString()
  ) {
    res
      .status(403)
      .json(new ApiResponse(403, "You do not have access to this alert"));
    return null;
  }

  return { alert, transaction };
};

// ────────────────────────────────────────────────────────────
// GET /fraud-alerts
// List fraud alerts for the logged-in user's transactions.
// Query params: status (optional filter), page, limit
// ────────────────────────────────────────────────────────────
const getAllFraudAlerts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    // fraud_alerts has no userId column, so first grab this user's
    // transaction ids, then filter alerts against that set
    const transactionIds = await Transaction.find({
      userId: req.user._id,
    }).distinct("_id");

    const filter = { transactionId: { $in: transactionIds } };
    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              `status must be one of: ${ALLOWED_STATUSES.join(", ")}`,
            ),
          );
      }
      filter.status = status;
    }

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [alerts, total] = await Promise.all([
      FraudAlert.find(filter)
        .populate("transactionId") // pulls in amount/date/description for context
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      FraudAlert.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(200, "Fraud alerts fetched", {
        alerts,
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
// GET /fraud-alerts/:id
// Get details of a specific fraud alert.
// ────────────────────────────────────────────────────────────
const getFraudAlertById = async (req, res) => {
  try {
    const result = await findOwnedAlertOrRespond(req, res);
    if (!result) return;

    const { alert, transaction } = result;

    return res.status(200).json(
      new ApiResponse(200, "Fraud alert fetched", {
        alert,
        transaction,
      }),
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

// ────────────────────────────────────────────────────────────
// PUT /fraud-alerts/:id/status
// Update alert status (reviewed, confirmed, dismissed).
// ────────────────────────────────────────────────────────────
const updateFraudAlertStatus = async (req, res) => {
  try {
    const result = await findOwnedAlertOrRespond(req, res);
    if (!result) return;

    const { status } = req.body;
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            `status must be one of: ${ALLOWED_STATUSES.join(", ")}`,
          ),
        );
    }

    const { alert } = result;
    alert.status = status;
    await alert.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Fraud alert status updated", { alert }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
};

module.exports = {
  getAllFraudAlerts,
  getFraudAlertById,
  updateFraudAlertStatus,
};
