const mongoose = require("mongoose");

const holdingSchema = new mongoose.Schema(
  {
    portfolioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Portfolio",
      required: true,
    },
    stockSymbol: {
      type: String,
      ref: "Stock",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    avgPrice: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Holding", holdingSchema);
