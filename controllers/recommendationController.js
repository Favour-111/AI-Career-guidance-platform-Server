const axios = require("axios");
const Profile = require("../models/Profile");
const Recommendation = require("../models/Recommendation");
const MarketData = require("../models/MarketData");
const ActivityLog = require("../models/ActivityLog");
const { buildMlServiceUrl } = require("../config/mlService");
const {
  createCareerIndex,
  enrichRecommendationWithMarketData,
} = require("../utils/marketInsights");

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

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getCareerKeywords = (career) =>
  [
    career.title,
    career.category,
    career.description,
    ...(career.aliases || []),
    ...(career.topSkills || []).map((skill) => skill?.name),
  ]
    .map(normalize)
    .filter(Boolean)
    .join(" ");

const buildFallbackRecommendations = (profile, marketCareers = []) => {
  const userSkills = (profile.skills || [])
    .map((skill) => normalize(skill.name))
    .filter(Boolean);
  const userInterests = (profile.interests || [])
    .map((interest) => normalize(interest))
    .filter(Boolean);
  const targetCareer = normalize(profile.targetCareer);
  const fieldOfStudy = normalize(profile.fieldOfStudy);

  const sourceCareers = marketCareers.length
    ? marketCareers.map((career) => ({
        careerId: career.careerId,
        title: career.title,
        category: career.category,
        description: career.description,
        demandLevel: career.demandLevel,
        growthRate: career.growthRate,
        averageSalary: career.averageSalary,
        topSkills: career.topSkills || [],
        aliases: career.aliases || [],
        learningPaths: career.learningPaths || [],
        salaryRange: career.averageSalary
          ? { min: career.averageSalary.entry, max: career.averageSalary.senior }
          : undefined,
      }))
    : CAREER_FALLBACKS;

  const scored = sourceCareers.map((career) => {
    const careerKeywords = getCareerKeywords(career);
    const topSkillNames = (career.topSkills || career.requiredSkills || [])
      .map((skill) => normalize(skill.name || skill))
      .filter(Boolean);

    const skillMatches = topSkillNames.filter((skill) =>
      userSkills.some((userSkill) => skill.includes(userSkill) || userSkill.includes(skill)),
    );

    const textMatches = [targetCareer, fieldOfStudy, ...userInterests]
      .filter(Boolean)
      .reduce((count, token) => count + (careerKeywords.includes(token) ? 1 : 0), 0);

    const targetBoost = targetCareer && careerKeywords.includes(targetCareer) ? 16 : 0;
    const interestBoost = textMatches * 5;
    const skillBoost = skillMatches.length * 14;
    const demandBoost = career.demandLevel === "Very High" ? 12 : career.demandLevel === "High" ? 8 : career.demandLevel === "Medium" ? 4 : 0;
    const growthBoost = Math.min(10, Math.max(0, Number(career.growthRate || 0) / 4));
    const baseScore = 35 + targetBoost + interestBoost + skillBoost + demandBoost + growthBoost;
    const matchScore = Math.max(30, Math.min(98, Math.round(baseScore)));

    const skillGaps = topSkillNames
      .filter((required) => !userSkills.some((skill) => skill.includes(required) || required.includes(skill)))
      .slice(0, 4)
      .map((gap) => gap.toUpperCase());

    return {
      careerId: career.careerId,
      title: career.title,
      category: career.category,
      matchScore,
      description: career.description,
      salaryRange: career.salaryRange,
      demand: career.demandLevel || career.demand,
      demandLevel: career.demandLevel,
      growthRate: career.growthRate,
      averageSalary: career.averageSalary,
      skillGaps,
      topSkills: career.topSkills,
      learningPaths: career.learningPaths,
    };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
};

const enrichRecommendations = (recommendations = [], marketCareers = []) => {
  const marketIndex = createCareerIndex(marketCareers);
  return recommendations.map((recommendation) =>
    enrichRecommendationWithMarketData(recommendation, marketIndex),
  );
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

    const marketCareers = await MarketData.find({ region: "Nigeria" }).lean();

    const payload = {
      user_id: req.user._id.toString(),
      skills: (profile.skills || []).map((s) => ({ name: s.name, level: s.level })),
      interests: profile.interests || [],
      target_career: profile.targetCareer || null,
      field: profile.fieldOfStudy || null,
    };

    let mlResponse;
    let usedFallback = false;
    try {
      const response = await axios.post(buildMlServiceUrl("/predict"), payload, {
        timeout: 30000,
        headers: { "Content-Type": "application/json" },
      });
      mlResponse = response.data;
    } catch (mlError) {
      console.error("ML service error:", mlError.message);
      mlResponse = {
        recommendations: buildFallbackRecommendations(profile, marketCareers),
      };
      usedFallback = true;
    }

    const enrichedRecommendations = enrichRecommendations(
      mlResponse.recommendations || [],
      marketCareers,
    );

    const recommendation = await Recommendation.create({
      user: req.user._id,
      careers: enrichedRecommendations,
      inputSnapshot: {
        skills: (profile.skills || []).map((s) => ({ name: s.name, level: s.level })),
        interests: profile.interests || [],
      },
    });
    const recommendationCount = mlResponse.recommendations?.length || 0;

    await ActivityLog.create({
      user: req.user._id,
      action: "recommendation_generated",
      description: `Generated ${recommendationCount} career recommendations`,
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
