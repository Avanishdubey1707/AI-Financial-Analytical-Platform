const mongoose = require('mongoose');

const stockPriceSchema = new mongoose.Schema(
  {
    stockSymbol: {
        type: String,
        ref: "Stock",
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    open: {
        type: Number,
        required: true,
    },
    close: {
        type: Number,
        required: true,
    },
    high: {
        type: Number,
        required: true,

    },
    low: {
        type: Number,
        required: true,
    },
    volume: {
        type: Number,
        required: true,
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model("StockPrice", stockPriceSchema);