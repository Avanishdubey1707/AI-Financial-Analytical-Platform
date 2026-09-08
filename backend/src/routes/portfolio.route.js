const express = require("express");
const router = express.Router();

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
  .patch(updatePortfolio)
  .delete(deletePortfolio);

router.route("/:id/holdings").get(getAllPortfolioHoldings).post(addHolding);

router
  .route("/:id/holdings/:holdingId")
  .patch(updateHolding)
  .delete(deleteHolding);

router.get("/:id/value", getPortfolioValue);
router.get("/:id/performance", getPortfolioPerformance);

module.exports = router;