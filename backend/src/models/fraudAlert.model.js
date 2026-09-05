const mongoose = require('mongoose');

const fraudAlertSchema = new mongoose.Schema({
    transactionId: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
        required:true,
    },
    riskScore: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['PENDING', 'REVIEWED', 'CONFIRMED', DISMISSED],
        default: 'PENDING',
    },

}, {
    timestamps: true,
});

module.exports = mongoose.model("FraudAlert", fraudAlertSchema);
