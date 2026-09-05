const express = require("express");
const router = express.Router();

const {
  getAllRecommendations,
  generateRecommendations,
  getRecommendationById,
  dismissRecommendation,
} = require("../controller/recommendation.controller");
const verifyJWT = require("../middleware/auth.middleware");

router.use(verifyJWT);

// IMPORTANT: /generate must be registered before /:id
router.get("/", getAllRecommendations);
router.post("/generate", generateRecommendations);
router.get("/:id", getRecommendationById);
router.delete("/:id", dismissRecommendation);

module.exports = router;