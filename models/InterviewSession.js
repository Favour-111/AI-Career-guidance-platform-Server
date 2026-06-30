const mongoose = require("mongoose");

const interviewTurnSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 4000 },
    answer: { type: String, required: true, trim: true, maxlength: 8000 },
    score: { type: Number, min: 0, max: 100 },
    communication: { type: String, trim: true },
    technical: { type: String, trim: true },
    strengths: [{ type: String, trim: true }],
    improvements: [{ type: String, trim: true }],
    suggestedAnswer: { type: String, trim: true, maxlength: 4000 },
    followUpQuestion: { type: String, trim: true, maxlength: 4000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const interviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetCareer: { type: String, trim: true, default: "" },
    roleKey: { type: String, trim: true, default: "general" },
    focus: { type: String, trim: true, default: "" },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "intermediate",
    },
    profileSnapshot: {
      targetCareer: { type: String, trim: true, default: "" },
      fieldOfStudy: { type: String, trim: true, default: "" },
      interests: [{ type: String, trim: true }],
      skills: [{ type: String, trim: true }],
      experienceLevel: { type: String, trim: true, default: "" },
      experienceCount: { type: Number, default: 0 },
    },
    initialQuestion: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    turns: {
      type: [interviewTurnSchema],
      default: [],
    },
    summary: {
      overallScore: { type: Number, min: 0, max: 100 },
      averageLength: { type: Number, min: 0 },
      strongestArea: { type: String, trim: true },
      weakestArea: { type: String, trim: true },
      recommendations: [{ type: String, trim: true }],
      sampleAnswer: { type: String, trim: true, maxlength: 6000 },
    },
    lastTurnAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("InterviewSession", interviewSessionSchema);
