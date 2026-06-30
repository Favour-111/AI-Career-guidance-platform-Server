const mongoose = require("mongoose");

const marketDataSchema = new mongoose.Schema(
  {
    careerId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String },
    aliases: [{ type: String }],
    demandLevel: {
      type: String,
      enum: ["Very High", "High", "Medium", "Low"],
      default: "Medium",
    },
    demandScore: { type: Number, min: 0, max: 100 },
    averageSalary: {
      entry: { type: Number },
      mid: { type: Number },
      senior: { type: Number },
    },
    salaryTrend: {
      direction: { type: String },
      yoyGrowthPct: { type: Number },
      note: { type: String },
    },
    industryGrowth: {
      outlook: { type: String },
      growthRate: { type: Number },
      drivers: [{ type: String }],
      risks: [{ type: String }],
    },
    growthRate: { type: Number, default: 0 }, // percentage
    topSkills: [
      {
        name: { type: String },
        importance: { type: Number, min: 1, max: 100 },
      },
    ],
    jobOpenings: { type: Number, default: 0 },
    liveOpenings: { type: Number, default: 0 },
    companies: [{ type: String }],
    topHiringCompanies: [{ type: String }],
    trendingSkills: [{ type: String }],
    learningPaths: [
      {
        title: { type: String },
        url: { type: String },
        type: { type: String },
        duration: { type: String },
        provider: { type: String },
        description: { type: String },
      },
    ],
    certifications: [
      {
        name: { type: String },
        provider: { type: String },
        why: { type: String },
      },
    ],
    careerPathways: [
      {
        stage: { type: String },
        title: { type: String },
        description: { type: String },
        timeframe: { type: String },
      },
    ],
    emergingTrends: [{ type: String }],
    remotePercent: { type: Number, min: 0, max: 100 },
    hybridPercent: { type: Number, min: 0, max: 100 },
    trending: { type: Boolean, default: false },
    remote: { type: Boolean, default: false },
    hiringTrend: { type: String },
    region: { type: String, default: "Nigeria" },
    currency: { type: String, default: "NGN" },
    marketUpdatedAt: { type: Date },
    marketSources: [
      {
        name: { type: String },
        url: { type: String },
        type: { type: String },
        lastCheckedAt: { type: String },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("MarketData", marketDataSchema);
