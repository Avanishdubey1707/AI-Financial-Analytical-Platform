const express = require("express");
const router = express.Router();


const {
  getPredictionsForStock,
  generatePrediction,
  getPredictionById,
  getLatestPredictions,
} = require("../controller/prediction.controller");
const verifyJWT = require("../middleware/auth.middleware");

router.use(verifyJWT); // predictions are a paid/logged-in feature — adjust if you want public reads

// IMPORTANT: /latest must be registered before /:id
router.get("/latest", getLatestPredictions);
router.get("/:id", getPredictionById);

router.get("/stocks/:symbol", getPredictionsForStock);
router.post("/stocks/:symbol", generatePrediction);

module.exports = router;