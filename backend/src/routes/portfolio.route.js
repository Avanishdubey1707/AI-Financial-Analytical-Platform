const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware"); // sets req.user

const {
  getAllPortfolios,
  createPortfolio,
  getPortfolioById,
  updatePortfolio,
  deletePortfolio,
  getAllPortfolioHoldings,
  addHolding,
  updateHolding,
  deleteHolding,
  getPortfolioValue,
  getPortfolioPerformance,
} = require("../controller/portfolio.controller");
const verifyJWT = require("../middleware/auth.middleware");

router.use(verifyJWT); // every route below requires a logged-in user

router.route("/").get(getAllPortfolios).post(createPortfolio);

router
  .route("/:id")
  .get(getPortfolioById)
  .put(updatePortfolio)
  .delete(deletePortfolio);

router.route("/:id/holdings").get(getAllPortfolioHoldings).post(addHolding);

router
  .route("/:id/holdings/:holdingId")
  .put(updateHolding)
  .delete(deleteHolding);

router.get("/:id/value", getPortfolioValue);
router.get("/:id/performance", getPortfolioPerformance);

module.exports = router;