
const mongoose = require("mongoose");
const Stock = require("../src/models/stocksModel/stock.model");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/major_project";

// A starter list mixing NSE (India) and major US exchanges.
// Extend this freely — it's just data.
const stocks = [
  // ── NSE (India) ──
  { symbol: "RELIANCE", name: "Reliance Industries Ltd.", sector: "Energy", exchange: "NSE" },
  { symbol: "TCS", name: "Tata Consultancy Services", sector: "Technology", exchange: "NSE" },
  { symbol: "INFY", name: "Infosys Ltd.", sector: "Technology", exchange: "NSE" },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd.", sector: "Financials", exchange: "NSE" },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd.", sector: "Financials", exchange: "NSE" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd.", sector: "Consumer Goods", exchange: "NSE" },
  { symbol: "ITC", name: "ITC Ltd.", sector: "Consumer Goods", exchange: "NSE" },
  { symbol: "SBIN", name: "State Bank of India", sector: "Financials", exchange: "NSE" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd.", sector: "Telecom", exchange: "NSE" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Financials", exchange: "NSE" },
  { symbol: "LT", name: "Larsen & Toubro Ltd.", sector: "Industrials", exchange: "NSE" },
  { symbol: "MARUTI", name: "Maruti Suzuki India Ltd.", sector: "Automotive", exchange: "NSE" },
  { symbol: "ASIANPAINT", name: "Asian Paints Ltd.", sector: "Materials", exchange: "NSE" },
  { symbol: "WIPRO", name: "Wipro Ltd.", sector: "Technology", exchange: "NSE" },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries", sector: "Healthcare", exchange: "NSE" },

  // ── NASDAQ / NYSE (US) ──
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Automotive", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Technology", exchange: "NASDAQ" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financials", exchange: "NYSE" },
  { symbol: "V", name: "Visa Inc.", sector: "Financials", exchange: "NYSE" },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", exchange: "NYSE" },
];

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB:", MONGO_URI);

    let upsertedCount = 0;
    let modifiedCount = 0;

    for (const stock of stocks) {
      const result = await Stock.findOneAndUpdate(
        { symbol: stock.symbol },
        stock,
        { upsert: true, new: true, rawResult: true },
      );

      // rawResult tells us whether this was a fresh insert or an update
      if (result.lastErrorObject?.upserted) {
        upsertedCount++;
      } else {
        modifiedCount++;
      }
    }

    console.log(`Seeding complete.`);
    console.log(`  Newly inserted: ${upsertedCount}`);
    console.log(`  Already existed (updated): ${modifiedCount}`);
    console.log(`  Total in list: ${stocks.length}`);
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

seed();