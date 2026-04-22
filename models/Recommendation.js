const mongoose = require("mongoose");

const careerRecommendationSchema = new mongoose.Schema({
  careerId: { type: String, required: true },
  title: { type: String, required: true },
  matchScore: { type: Number, required: true, min: 0, max: 100 },
  description: { type: String },
  salaryRange: {
    min: { type: Number },
    max: { type: Number },
  },
  demand: { type: String },
  skillGaps: [{ type: String }],
  learningPaths: [
    {
      title: { type: String },
      url: { type: String },
      type: { type: String },
      duration: { type: String },
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
