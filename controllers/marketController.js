const MarketData = require("../models/MarketData");
const ActivityLog = require("../models/ActivityLog");

// @desc    Get all market data / trending careers
// @route   GET /api/market/careers
// @access  Private
const getTrendingCareers = async (req, res, next) => {
  try {
    const { category, demand, search, limit = 20 } = req.query;

    const query = {};
    if (category) query.category = category;
    if (demand) query.demandLevel = demand;
    if (search) query.title = { $regex: search, $options: "i" };

    const careers = await MarketData.find(query)
      .sort({ trending: -1, growthRate: -1 })
      .limit(parseInt(limit));

    await ActivityLog.create({
      user: req.user._id,
      action: "market_data_viewed",
      description: "Viewed market trends",
    }).catch(() => {}); // Fire and forget

    res.json({ careers, total: careers.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Get in-demand skills
// @route   GET /api/market/skills
// @access  Private
const getInDemandSkills = async (req, res, next) => {
  try {
    const careers = await MarketData.find({});

    // Aggregate skills across all careers
    const skillMap = {};
    careers.forEach((career) => {
      career.topSkills.forEach((skill) => {
        if (!skillMap[skill.name]) {
          skillMap[skill.name] = {
            name: skill.name,
            count: 0,
            totalImportance: 0,
          };
        }
        skillMap[skill.name].count += 1;
        skillMap[skill.name].totalImportance += skill.importance;
      });
    });

    const skills = Object.values(skillMap)
      .map((s) => ({
        ...s,
        avgImportance: Math.round((s.totalImportance / s.count) * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    res.json({ skills });
  } catch (error) {
    next(error);
  }
};

// @desc    Get market statistics
// @route   GET /api/market/stats
// @access  Private
const getMarketStats = async (req, res, next) => {
  try {
    const total = await MarketData.countDocuments();
    const byDemand = await MarketData.aggregate([
      { $group: { _id: "$demandLevel", count: { $sum: 1 } } },
    ]);
    const byCategory = await MarketData.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgSalary: { $avg: "$averageSalary.mid" },
        },
      },
    ]);
    const topGrowth = await MarketData.find({})
      .sort({ growthRate: -1 })
      .limit(5)
      .select("title growthRate demandLevel");

    res.json({ total, byDemand, byCategory, topGrowth });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single career market data
// @route   GET /api/market/careers/:careerId
// @access  Private
const getCareerMarketData = async (req, res, next) => {
  try {
    const career = await MarketData.findOne({ careerId: req.params.careerId });
    if (!career) {
      return res.status(404).json({ message: "Career data not found" });
    }
    res.json({ career });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrendingCareers,
  getInDemandSkills,
  getMarketStats,
  getCareerMarketData,
};
