const axios = require("axios");
const Profile = require("../models/Profile");
const Recommendation = require("../models/Recommendation");
const ActivityLog = require("../models/ActivityLog");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

const CAREER_FALLBACKS = [
  {
    careerId: "frontend-dev",
    title: "Frontend Developer",
    description: "Build responsive user interfaces and improve product usability.",
    salaryRange: { min: 2200000, max: 8500000 },
    demand: "High",
    requiredSkills: ["react", "javascript", "html", "css", "typescript", "ui"],
    learningPaths: [
      {
        title: "Frontend Engineer Path",
        url: "https://roadmap.sh/frontend",
        type: "roadmap",
        duration: "8-16 weeks",
      },
    ],
  },
  {
    careerId: "backend-dev",
    title: "Backend Developer",
    description: "Design APIs, services, and data models for scalable applications.",
    salaryRange: { min: 2600000, max: 9800000 },
    demand: "High",
    requiredSkills: ["node", "express", "api", "sql", "database", "python", "auth"],
    learningPaths: [
      {
        title: "Backend Engineer Path",
        url: "https://roadmap.sh/backend",
        type: "roadmap",
        duration: "10-18 weeks",
      },
    ],
  },
  {
    careerId: "data-analyst",
    title: "Data Analyst",
    description: "Analyze datasets to generate insights and support decisions.",
    salaryRange: { min: 1800000, max: 7200000 },
    demand: "High",
    requiredSkills: ["sql", "python", "excel", "dashboard", "analysis", "statistics"],
    learningPaths: [
      {
        title: "Data Analyst Path",
        url: "https://roadmap.sh/data-analyst",
        type: "roadmap",
        duration: "8-14 weeks",
      },
    ],
  },
  {
    careerId: "product-manager",
    title: "Product Manager",
    description: "Define product strategy, prioritize features, and align teams.",
    salaryRange: { min: 3500000, max: 12500000 },
    demand: "Medium",
    requiredSkills: ["product", "stakeholder", "roadmap", "communication", "metrics"],
    learningPaths: [
      {
        title: "Product Manager Path",
        url: "https://roadmap.sh/product-manager",
        type: "roadmap",
        duration: "8-12 weeks",
      },
    ],
  },
  {
    careerId: "devops-engineer",
    title: "DevOps Engineer",
    description: "Automate deployment pipelines and improve infrastructure reliability.",
    salaryRange: { min: 3200000, max: 13200000 },
    demand: "High",
    requiredSkills: ["docker", "kubernetes", "aws", "ci/cd", "linux", "monitoring"],
    learningPaths: [
      {
        title: "DevOps Path",
        url: "https://roadmap.sh/devops",
        type: "roadmap",
        duration: "10-16 weeks",
      },
    ],
  },
  {
    careerId: "ux-designer",
    title: "UX Designer",
    description: "Design intuitive experiences through research, prototyping, and testing.",
    salaryRange: { min: 2000000, max: 7600000 },
    demand: "Medium",
    requiredSkills: ["ux", "figma", "wireframe", "research", "prototype", "design"],
    learningPaths: [
      {
        title: "UX Design Path",
        url: "https://roadmap.sh/ux-design",
        type: "roadmap",
        duration: "8-14 weeks",
      },
    ],
  },
];

const buildFallbackRecommendations = (profile) => {
  const userSkills = (profile.skills || []).map((skill) => String(skill.name || "").toLowerCase());
  const userInterests = (profile.interests || []).map((interest) => String(interest || "").toLowerCase());
  const userText = [
    String(profile.targetCareer || "").toLowerCase(),
    String(profile.fieldOfStudy || "").toLowerCase(),
    ...userInterests,
  ].join(" ");

  const scored = CAREER_FALLBACKS.map((career) => {
    const skillMatches = career.requiredSkills.filter((required) =>
      userSkills.some((skill) => skill.includes(required) || required.includes(skill)),
    );

    const interestBoost = career.requiredSkills.some((required) => userText.includes(required)) ? 8 : 0;
    const baseScore = 40 + skillMatches.length * 12 + interestBoost;
    const matchScore = Math.max(35, Math.min(96, baseScore));

    const skillGaps = career.requiredSkills
      .filter((required) =>
        !userSkills.some((skill) => skill.includes(required) || required.includes(skill)),
      )
      .slice(0, 4)
      .map((gap) => gap.toUpperCase());

    return {
      careerId: career.careerId,
      title: career.title,
      matchScore,
      description: career.description,
      salaryRange: career.salaryRange,
      demand: career.demand,
      skillGaps,
      learningPaths: career.learningPaths,
    };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 6);
};

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
    let usedFallback = false;
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/predict`, payload, {
        timeout: 30000,
        headers: { "Content-Type": "application/json" },
      });
      mlResponse = response.data;
    } catch (mlError) {
      console.error("ML service error:", mlError.message);
      mlResponse = {
        recommendations: buildFallbackRecommendations(profile),
      };
      usedFallback = true;
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
      warning: usedFallback
        ? "ML service is temporarily unavailable. Showing fallback recommendations based on your profile."
        : null,
      fallback: usedFallback,
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
