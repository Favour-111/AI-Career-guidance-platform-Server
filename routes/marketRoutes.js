const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getTrendingCareers,
  getInDemandSkills,
  getMarketStats,
  getCareerMarketData,
} = require("../controllers/marketController");

router.get("/careers", protect, getTrendingCareers);
router.get("/skills", protect, getInDemandSkills);
router.get("/stats", protect, getMarketStats);
router.get("/careers/:careerId", protect, getCareerMarketData);

module.exports = router;
