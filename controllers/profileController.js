const Profile = require("../models/Profile");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const path = require("path");

// @desc    Get current user's profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id }).populate(
      "user",
      "name email avatar",
    );
    if (!profile) {
      return res
        .status(404)
        .json({ message: "Profile not found. Please create your profile." });
    }
    res.json({ profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update profile
// @route   POST /api/profile
// @access  Private
const upsertProfile = async (req, res, next) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    const allowed = [
      "bio",
      "location",
      "phone",
      "website",
      "linkedin",
      "github",
      "targetCareer",
      "careerGoals",
      "fieldOfStudy",
      "interests",
      "education",
      "experience",
    ];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) profile[field] = req.body[field];
    });

    // Sanitize education years to Numbers before saving (guard against empty strings from client)
    if (Array.isArray(profile.education)) {
      profile.education = profile.education.map((edu) => {
        const e = edu.toObject ? edu.toObject() : { ...edu };
        if (e.startYear === "" || e.startYear === null) delete e.startYear;
        else if (e.startYear !== undefined) e.startYear = Number(e.startYear);
        if (e.endYear === "" || e.endYear === null) delete e.endYear;
        else if (e.endYear !== undefined) e.endYear = Number(e.endYear);
        return e;
      });
    }

    console.log(
      "[upsertProfile] education payload:",
      JSON.stringify(profile.education),
    );

    // Explicitly mark education as modified so Mongoose 8's change-detection
    // does not skip the field when the double-assignment pattern (set then map)
    // results in a DocumentArray that compares equal to the previous value.
    profile.markModified("education");

    await profile.save(); // triggers completionPercentage pre-save hook
    await profile.populate("user", "name email avatar");

    console.log(
      "[upsertProfile] saved completionPercentage:",
      profile.completionPercentage,
    );

    await ActivityLog.create({
      user: req.user._id,
      action: "profile_update",
      description: "Profile updated",
    }).catch(() => {});

    res.json({ message: "Profile saved successfully", profile });
  } catch (error) {
    console.error("[upsertProfile] ERROR:", error.name, error.message);
    next(error);
  }
};

// @desc    Update skills specifically
// @route   PUT /api/profile/skills
// @access  Private
const updateSkills = async (req, res, next) => {
  try {
    const { skills } = req.body;
    if (!Array.isArray(skills)) {
      return res.status(400).json({ message: "Skills must be an array" });
    }

    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }
    profile.skills = skills;

    await profile.save(); // triggers completionPercentage pre-save hook

    await ActivityLog.create({
      user: req.user._id,
      action: "skill_update",
      description: `Updated ${skills.length} skills`,
    }).catch(() => {});

    res.json({
      message: "Skills updated successfully",
      skills: profile.skills,
      completionPercentage: profile.completionPercentage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload resume
// @route   POST /api/profile/resume
// @access  Private
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const resumeUrl = `/uploads/resumes/${req.file.filename}`;

    await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $set: { resumeUrl, resumeOriginalName: req.file.originalname } },
      { upsert: true },
    );

    await ActivityLog.create({
      user: req.user._id,
      action: "resume_uploaded",
      description: `Uploaded resume: ${req.file.originalname}`,
    });

    res.json({
      message: "Resume uploaded successfully",
      resumeUrl,
      originalName: req.file.originalname,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle bookmark a career
// @route   POST /api/profile/bookmark
// @access  Private
const toggleBookmark = async (req, res, next) => {
  try {
    const { careerId } = req.body;
    const user = await User.findById(req.user._id);

    const index = user.bookmarkedCareers.indexOf(careerId);
    let action;

    if (index === -1) {
      user.bookmarkedCareers.push(careerId);
      action = "career_bookmarked";
    } else {
      user.bookmarkedCareers.splice(index, 1);
      action = "career_unbookmarked";
    }

    await user.save();

    await ActivityLog.create({
      user: req.user._id,
      action,
      description: `Career ${careerId} ${action.replace("career_", "")}`,
    });

    res.json({
      message: index === -1 ? "Career bookmarked" : "Bookmark removed",
      bookmarkedCareers: user.bookmarkedCareers,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  upsertProfile,
  updateSkills,
  uploadResume,
  toggleBookmark,
};
