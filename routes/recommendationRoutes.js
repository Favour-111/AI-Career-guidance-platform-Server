const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { mlLimiter } = require("../middleware/rateLimiter");
const {
  generateRecommendations,
  getLatestRecommendations,
  getRecommendationHistory,
} = require("../controllers/recommendationController");

router.get("/", protect, getLatestRecommendations);
router.post("/generate", protect, mlLimiter, generateRecommendations);
router.get("/history", protect, getRecommendationHistory);

module.exports = router;
