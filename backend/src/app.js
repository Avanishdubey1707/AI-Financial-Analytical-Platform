const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors(["*"]));
// Middleware to parse JSON requests
app.use(express.json({ limit: "50mb" }));

// All Routes
const userRoutes = require("./routes/user.route");
const portfolioRoute = require("./routes/portfolio.route");
const transactionRoute = require("./routes/transaction.route");
const fraudRoute = require("./routes/fraud.route");

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/portfolio", portfolioRoute);
app.use("/api/v1/transaction", transactionRoute);
app.use("/api/v1/fraud-alert", fraudRoute);


module.exports = app;
