/**
 * seedStockPrices.js
 *
 * Generates random-but-realistic daily OHLCV price history for every
 * stock already in the Stock table. Run seedStocks.js FIRST.
 *
 * Usage:
 *   node scripts/seedStockPrices.js
 *   node scripts/seedStockPrices.js --days=90     (default is 60)
 *
 * Safe to re-run — upserts on {stockSymbol, date}, so re-running just
 * regenerates the same date range instead of duplicating rows.
 */

const mongoose = require("mongoose");
const Stock = require("../src/models/stocksModel/stock.model");
const StockPrice = require("../src/models/stocksModel/stockPrice.model");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/major_project";

// crude CLI flag parsing: --days=90
const daysArg = process.argv.find((a) => a.startsWith("--days="));
const NUM_DAYS = daysArg ? Number(daysArg.split("=")[1]) : 60;

// rough starting price ranges per exchange, just so numbers look plausible
// (NSE stocks in ₹ tend to be higher-numbered, US stocks vary widely)
const BASE_PRICE_RANGE = { NSE: [300, 3500], NASDAQ: [50, 500], NYSE: [50, 500] };

const randomBetween = (min, max) => Math.random() * (max - min) + min;

/**
 * Generates a random-walk price series: each day's close moves from
 * the previous day's close by a small random % (drift + noise), which
 * looks far more realistic than pure random numbers per day.
 */
const generatePriceSeries = (startPrice, numDays) => {
  const series = [];
  let prevClose = startPrice;

  const today = new Date();

  for (let i = numDays - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // daily % change: mostly small moves, occasionally bigger swings
    const dailyChangePercent = (Math.random() - 0.48) * 4; // slight upward bias, -2% to +2%ish
    const open = prevClose;
    const close = Number((open * (1 + dailyChangePercent / 100)).toFixed(2));

    const high = Number(Math.max(open, close) * randomBetween(1.001, 1.02).toFixed(4));
    const low = Number(Math.min(open, close) * randomBetween(0.98, 0.999).toFixed(4));
    const volume = Math.floor(randomBetween(100000, 5000000));

    series.push({
      date,
      open: Number(open.toFixed(2)),
      close,
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      volume,
    });

    prevClose = close;
  }

  return series;
};

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB:", MONGO_URI);

    const stocks = await Stock.find({});
    if (stocks.length === 0) {
      console.log("No stocks found — run seedStocks.js first.");
      return;
    }

    console.log(`Generating ${NUM_DAYS} days of price history for ${stocks.length} stocks...`);

    let totalInserted = 0;

    for (const stock of stocks) {
      const [minPrice, maxPrice] = BASE_PRICE_RANGE[stock.exchange] || [50, 500];
      const startPrice = Number(randomBetween(minPrice, maxPrice).toFixed(2));

      const series = generatePriceSeries(startPrice, NUM_DAYS);

      // bulkWrite = one round trip for all days of this stock,
      // instead of N individual save() calls
      const operations = series.map((day) => ({
        updateOne: {
          filter: { stockSymbol: stock.symbol, date: day.date },
          update: { $set: { stockSymbol: stock.symbol, ...day } },
          upsert: true,
        },
      }));

      await StockPrice.bulkWrite(operations);
      totalInserted += operations.length;

      console.log(`  ${stock.symbol}: ${operations.length} days seeded (last close: ${series[series.length - 1].close})`);
    }

    console.log(`\nDone. ${totalInserted} price records written across ${stocks.length} stocks.`);
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

seed();