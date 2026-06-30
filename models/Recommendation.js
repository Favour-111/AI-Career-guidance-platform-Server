const mongoose = require("mongoose");

const careerRecommendationSchema = new mongoose.Schema({
  careerId: { type: String, required: true },
  title: { type: String, required: true },
  category: { type: String },
  matchScore: { type: Number, required: true, min: 0, max: 100 },
  description: { type: String },
  salaryRange: {
    min: { type: Number },
    max: { type: Number },
  },
  demand: { type: String },
  demandLevel: { type: String },
  growthRate: { type: Number },
  averageSalary: {
    entry: { type: Number },
    mid: { type: Number },
    senior: { type: Number },
  },
  skillGaps: [{ type: String }],
  topSkills: [
    {
      name: { type: String },
      importance: { type: Number },
    },
  ],
  trendingSkills: [{ type: String }],
  topHiringCompanies: [{ type: String }],
  remotePercent: { type: Number },
  hiringTrend: { type: String },
  liveOpenings: { type: Number },
  marketUpdatedAt: { type: Date },
  marketSources: [
    {
      name: { type: String },
      url: { type: String },
      type: { type: String },
      lastCheckedAt: { type: String },
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
  industryGrowth: {
    outlook: { type: String },
    growthRate: { type: Number },
    drivers: [{ type: String }],
    risks: [{ type: String }],
  },
  salaryTrend: {
    direction: { type: String },
    yoyGrowthPct: { type: Number },
    note: { type: String },
  },
  aliases: [{ type: String }],
  marketMatch: {
    careerId: { type: String },
    title: { type: String },
  },
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
});

const recommendationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    careers: [careerRecommendationSchema],
    inputSnapshot: {
      skills: [{ name: String, level: Number }],
      interests: [String],
    },
    generatedAt: { type: Date, default: Date.now },
    isLatest: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Mark previous recommendations as not latest before saving a new one
recommendationSchema.pre("save", async function (next) {
  if (this.isNew) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isLatest: false },
    );
  }
  next();
});

module.exports = mongoose.model("Recommendation", recommendationSchema);
