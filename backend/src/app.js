const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors(["*"]));
// Middleware to parse JSON requests
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => {
    res.json({msg: "Your website working"})
})

// All Routes
const userRoutes = require("./routes/user.route");
const portfolioRoutes = require("./routes/portfolio.route");
const transactionRoutes = require("./routes/transaction.route");
const fraudRoutes = require("./routes/fraud.route");
const stockRoutes = require("./routes/stock.route");
const predictionRoutes = require("./routes/prediction.route");
const rocommendationRoutes = require("./routes/recommendation.route");
const expenseForecastRoutes = require("./routes/expenseForecast.route");
const reportRoutes = require("./routes/report.routes");

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/portfolios", portfolioRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/fraud-alerts", fraudRoutes);
app.use("/api/v1/stocks", stockRoutes);
app.use("/api/v1/predictions", predictionRoutes);
app.use("/api/v1/recommendations", rocommendationRoutes);
app.use("/api/v1//expense-forecasts", expenseForecastRoutes);
app.use("/api/v1/reports", reportRoutes);

module.exports = app;
