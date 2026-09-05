const express = require("express");
const router = express.Router();

const {
  getAllStocks,
  getStockBySymbol,
  getStockPrices,
  getLatestStockPrice,
  addStockPrice,
  getStockChart,
} = require("../controller/stock.controller");

// Public reads — no auth required, since market data isn't user-specific.
// Only the write endpoint (ingestion) needs a logged-in admin.
router.get("/", getAllStocks);
router.get("/:symbol", getStockBySymbol);
router.get("/:symbol/prices", getStockPrices);
router.get("/:symbol/prices/latest", getLatestStockPrice);
router.get("/:symbol/chart", getStockChart);

router.post("/:symbol/prices", auth, addStockPrice);

module.exports = router;