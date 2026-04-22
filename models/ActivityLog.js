const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "login",
        "logout",
        "profile_update",
        "skill_update",
        "recommendation_generated",
        "career_bookmarked",
        "career_unbookmarked",
        "resume_uploaded",
        "course_viewed",
        "market_data_viewed",
      ],
    },
    description: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  {
    timestamps: true,
  },
);

// Auto-delete logs older than 90 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
