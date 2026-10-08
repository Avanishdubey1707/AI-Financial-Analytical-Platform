const cors = require("cors");

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://fin-ai-sepia-eight.vercel.app",
];

app.use(
    cors({
        origin: function (origin, callback) {
            
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            console.log("Blocked CORS origin:", origin);

            return callback(
                new Error(`CORS blocked for origin: ${origin}`)
            );
        },

        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Shop-Id",
        ],
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