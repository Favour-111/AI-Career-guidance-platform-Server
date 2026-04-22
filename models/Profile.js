const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  level: {
    type: Number,
    min: 1,
    max: 10,
    default: 5,
  },
  category: {
    type: String,
    enum: ["technical", "soft", "language", "tool", "other"],
    default: "technical",
  },
  yearsOfExperience: { type: Number, default: 0 },
});

const educationSchema = new mongoose.Schema({
  institution: { type: String, trim: true },
  degree: { type: String, trim: true },
  field: { type: String, trim: true },
  startYear: { type: Number },
  endYear: { type: Number },
  current: { type: Boolean, default: false },
});

const experienceSchema = new mongoose.Schema({
  company: { type: String, trim: true },
  title: { type: String, trim: true },
  description: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  current: { type: Boolean, default: false },
});

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    bio: { type: String, maxlength: [500, "Bio cannot exceed 500 characters"] },
    location: { type: String, trim: true },
    phone: { type: String, trim: true },
    website: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    skills: [skillSchema],
    interests: [{ type: String, trim: true }],
    education: [educationSchema],
    experience: [experienceSchema],
    targetCareer: { type: String, trim: true },
    careerGoals: {
      type: String,
      maxlength: [1000, "Career goals cannot exceed 1000 characters"],
    },
    fieldOfStudy: {
      type: String,
      trim: true,
      enum: [
        "",
        "Technology",
        "Medical & Health",
        "Finance & Economics",
        "Arts & Humanities",
        "Engineering",
        "Business & Management",
        "Law",
        "Education",
        "Science & Research",
        "Other",
      ],
      default: "",
    },
    resumeUrl: { type: String },
    resumeOriginalName: { type: String },
    completionPercentage: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Calculate profile completion before save
profileSchema.pre("save", function (next) {
  const fields = [
    this.bio,
    this.location,
    this.skills?.length > 0,
    this.interests?.length > 0,
    this.education?.length > 0,
    this.targetCareer,
    this.careerGoals,
    this.fieldOfStudy,
  ];
  const filled = fields.filter(Boolean).length;
  this.completionPercentage = Math.round((filled / fields.length) * 100);
  next();
});

module.exports = mongoose.model("Profile", profileSchema);
