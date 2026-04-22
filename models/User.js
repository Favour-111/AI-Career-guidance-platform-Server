const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["info", "success", "warning", "alert"],
    default: "info",
  },
  read: { type: Boolean, default: false },
  link: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    avatar: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String, select: false },
    lastLogin: { type: Date },
    notifications: [notificationSchema],
    bookmarkedCareers: [{ type: String }],
    preferences: {
      darkMode: { type: Boolean, default: false },
      emailNotifications: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare candidate password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
