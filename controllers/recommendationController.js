const axios = require("axios");
const Profile = require("../models/Profile");
const Recommendation = require("../models/Recommendation");
const ActivityLog = require("../models/ActivityLog");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// @desc    Generate career recommendations via ML service
// @route   POST /api/recommendations/generate
// @access  Private
const generateRecommendations = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(400).json({
        message: "Please complete your profile before getting recommendations",
      });
    }

    if (!profile.skills || profile.skills.length === 0) {
      return res
        .status(400)
        .json({ message: "Please add at least one skill to your profile" });
    }

    const payload = {
      user_id: req.user._id.toString(),
      skills: profile.skills.map((s) => ({ name: s.name, level: s.level })),
      interests: profile.interests || [],
      target_career: profile.targetCareer || null,
      field: profile.fieldOfStudy || null,
    };

    let mlResponse;
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/predict`, payload, {
        timeout: 30000,
        headers: { "Content-Type": "application/json" },
      });
      mlResponse = response.data;
    } catch (mlError) {
      console.error("ML service error:", mlError.message);
      // Fallback: return basic recommendations if ML service is down
      return res.status(503).json({
        message:
          "AI service is temporarily unavailable. Please try again later.",
        code: "ML_SERVICE_UNAVAILABLE",
      });
    }

    const recommendation = await Recommendation.create({
      user: req.user._id,
      careers: mlResponse.recommendations,
      inputSnapshot: {
        skills: profile.skills.map((s) => ({ name: s.name, level: s.level })),
        interests: profile.interests || [],
      },
    });

    await ActivityLog.create({
      user: req.user._id,
      action: "recommendation_generated",
      description: `Generated ${mlResponse.recommendations.length} career recommendations`,
    });

    res.json({
      message: "Recommendations generated successfully",
      recommendation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get latest recommendations
// @route   GET /api/recommendations
// @access  Private
const getLatestRecommendations = async (req, res, next) => {
  try {
    const recommendation = await Recommendation.findOne({
      user: req.user._id,
      isLatest: true,
    }).sort({ createdAt: -1 });

    if (!recommendation) {
      return res.json({
        recommendation: null,
        message: "No recommendations yet. Generate your first recommendation!",
      });
    }

    res.json({ recommendation });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recommendation history
// @route   GET /api/recommendations/history
// @access  Private
const getRecommendationHistory = async (req, res, next) => {
  try {
    const recommendations = await Recommendation.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ recommendations });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateRecommendations,
  getLatestRecommendations,
  getRecommendationHistory,
};
