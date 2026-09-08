const mongoose = require("mongoose");

const forecastSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    predictedAmount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("ExpenseForecast", forecastSchema);
