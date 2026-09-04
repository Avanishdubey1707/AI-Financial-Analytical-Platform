const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors(["*"]));
// Middleware to parse JSON requests
app.use(express.json({ limit: "50mb" }));

// All Routes
const userRoutes = require("./routes/user.route");


app.use("/api/v1/user", userRoutes);

module.exports = app;
