const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema(
  {
    stockSymbol: {
      type: String,
      ref: "Stock",
      required: true,
    },
    predictedPrice: {
      type: Number,
      required: true,
    },
    predictionDate: {
      type: Date,
      required: true,
    },
    modelUsed: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Prediction", predictionSchema);
