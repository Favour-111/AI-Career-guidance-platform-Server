const mongoose = require("mongoose");

const marketDataSchema = new mongoose.Schema(
  {
    careerId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String },
    demandLevel: {
      type: String,
      enum: ["Very High", "High", "Medium", "Low"],
      default: "Medium",
    },
    averageSalary: {
      entry: { type: Number },
      mid: { type: Number },
      senior: { type: Number },
    },
    growthRate: { type: Number, default: 0 }, // percentage
    topSkills: [
      {
        name: { type: String },
        importance: { type: Number, min: 1, max: 10 },
      },
    ],
    jobOpenings: { type: Number, default: 0 },
    companies: [{ type: String }],
    trending: { type: Boolean, default: false },
    remote: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("MarketData", marketDataSchema);
