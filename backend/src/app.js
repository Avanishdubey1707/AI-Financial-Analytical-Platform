const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    // Add your deployed frontend URL here later
];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests without an origin
            // such as Postman/server-to-server requests
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("Not allowed by CORS")
            );
        },

        credentials: true,
    })
);

app.use(express.json({ limit: "50mb" }));

app.use(cookieParser());

app.get("/", (req, res) => {
    res.json({
        msg: "Your website working",
    });
});

// ================================
// ROUTES
// ================================

const userRoutes = require("./routes/user.route");
const portfolioRoutes = require("./routes/portfolio.route");
const transactionRoutes = require("./routes/transaction.route");
const fraudRoutes = require("./routes/fraud.route");
const stockRoutes = require("./routes/stock.route");
const predictionRoutes = require("./routes/prediction.route");
const recommendationRoutes = require("./routes/recommendation.route");
const expenseForecastRoutes = require("./routes/expenseForecast.route");
const reportRoutes = require("./routes/report.routes");

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/portfolios", portfolioRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/fraud-alerts", fraudRoutes);
app.use("/api/v1/stocks", stockRoutes);
app.use("/api/v1/predictions", predictionRoutes);
app.use("/api/v1/recommendations", recommendationRoutes);
app.use("/api/v1/expense-forecasts", expenseForecastRoutes);
app.use("/api/v1/reports", reportRoutes);

module.exports = app;