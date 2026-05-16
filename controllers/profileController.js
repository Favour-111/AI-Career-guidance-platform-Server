const Profile = require("../models/Profile");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Tesseract = require("tesseract.js");

const SKILL_KEYWORDS = [
  "javascript", "typescript", "python", "java", "c++", "c#", "go", "ruby", "php",
  "react", "node", "express", "next", "vue", "angular", "django", "flask", "fastapi",
  "sql", "mongodb", "postgresql", "mysql", "redis", "firebase",
  "docker", "kubernetes", "aws", "azure", "gcp", "terraform", "linux", "ci/cd",
  "machine learning", "deep learning", "data analysis", "power bi", "tableau", "excel",
  "figma", "ui", "ux", "product management", "agile", "scrum", "communication",
  "leadership", "problem solving", "project management", "api", "rest", "graphql",
];

const ROLE_HINTS = [
  "software engineer", "frontend developer", "backend developer", "full stack developer",
  "data scientist", "data analyst", "devops engineer", "cloud engineer", "product manager",
  "ui ux designer", "cybersecurity analyst", "mobile developer", "business analyst",
  "nurse", "physician", "pharmacist", "financial analyst", "accountant", "lawyer",
  "teacher", "mechanical engineer", "civil engineer", "electrical engineer",
];

const FIELD_HINTS = [
  { field: "Technology", keywords: ["software", "developer", "javascript", "python", "api", "cloud", "devops"] },
  { field: "Medical & Health", keywords: ["medical", "nurse", "health", "clinical", "hospital", "pharmacy"] },
  { field: "Finance & Economics", keywords: ["finance", "accounting", "auditing", "economics", "investment", "banking"] },
  { field: "Arts & Humanities", keywords: ["design", "writer", "journalism", "creative", "translation", "humanities"] },
  { field: "Engineering", keywords: ["engineering", "mechanical", "electrical", "civil", "cad", "structural"] },
  { field: "Business & Management", keywords: ["business", "marketing", "sales", "operations", "strategy", "management"] },
  { field: "Law", keywords: ["law", "legal", "litigation", "contract", "compliance", "attorney"] },
  { field: "Education", keywords: ["teaching", "education", "curriculum", "lecturer", "instructor"] },
  { field: "Science & Research", keywords: ["research", "laboratory", "scientific", "biotech", "biostatistics"] },
];

const normalizeSpaces = (value) => String(value || "").replace(/\s+/g, " ").trim();

const extractTextFromResume = async (filePath, originalName) => {
  const ext = path.extname(originalName || filePath).toLowerCase();

  if (ext === ".pdf") {
    const buffer = fs.readFileSync(filePath);
    const parsed = await pdfParse(buffer);
    return normalizeSpaces(parsed.text || "");
  }

  if (ext === ".docx") {
    const parsed = await mammoth.extractRawText({ path: filePath });
    return normalizeSpaces(parsed.value || "");
  }

  if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
    const result = await Tesseract.recognize(filePath, "eng", {
      logger: () => {},
    });
    return normalizeSpaces(result?.data?.text || "");
  }

  return "";
};

const inferFieldOfStudy = (text) => {
  if (!text) return "";
  const lowered = text.toLowerCase();

  const scored = FIELD_HINTS.map((item) => ({
    field: item.field,
    score: item.keywords.reduce((sum, keyword) => sum + (lowered.includes(keyword) ? 1 : 0), 0),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0 ? scored[0].field : "";
};

const extractEducationEntries = (lines) => {
  const degreePattern = /(b\.?sc|bachelor|m\.?sc|master|ph\.?d|doctorate|diploma|hnd|ond|mba)/i;
  const yearPattern = /(19|20)\d{2}/g;

  const entries = [];
  for (const line of lines) {
    if (!degreePattern.test(line)) continue;

    const years = line.match(yearPattern) || [];
    const parts = line.split(/[-|,]/).map((part) => part.trim()).filter(Boolean);
    const degree = parts.find((part) => degreePattern.test(part)) || line;
    const institution = parts.find((part) => /(university|college|polytechnic|institute|school|academy)/i.test(part)) || "";
    const field = parts.find((part) => /(computer|engineering|science|business|finance|law|medicine|health|economics|education|arts)/i.test(part)) || "";

    entries.push({
      institution,
      degree,
      field,
      startYear: years[0] ? Number(years[0]) : undefined,
      endYear: years[1] ? Number(years[1]) : undefined,
      current: false,
    });

    if (entries.length >= 3) break;
  }

  return entries.filter((item) => item.institution || item.degree);
};

const parseResumeDetails = (rawText) => {
  const text = normalizeSpaces(rawText);
  const lines = String(rawText || "")
    .split(/\r?\n/)
    .map((line) => normalizeSpaces(line))
    .filter(Boolean);

  const firstLine = lines[0] || "";
  const name = firstLine && firstLine.length <= 60 && !/@|\d{3,}/.test(firstLine) ? firstLine : "";
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)?.[0] || "";
  const phone = text.match(/(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{3,4}/g)?.[0] || "";
  const linkedin = text.match(/https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/[A-Za-z0-9_\-/?=&%.]+/i)?.[0] || "";
  const github = text.match(/https?:\/\/(?:www\.)?github\.com\/[A-Za-z0-9_\-]+/i)?.[0] || "";
  const website = text.match(/https?:\/\/(?!.*linkedin|.*github)[^\s]+/i)?.[0] || "";

  const lowered = text.toLowerCase();
  const skills = SKILL_KEYWORDS
    .filter((skill) => lowered.includes(skill))
    .map((skill) => skill.split(" ").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" "))
    .slice(0, 20);

  const targetCareer = ROLE_HINTS.find((role) => lowered.includes(role)) || "";
  const fieldOfStudy = inferFieldOfStudy(lowered);
  const education = extractEducationEntries(lines);

  const interests = [];
  if (/(data|analytics|ai|machine learning)/i.test(text)) interests.push("Data", "AI");
  if (/(design|ux|ui|creative)/i.test(text)) interests.push("Design", "Creativity");
  if (/(business|strategy|marketing|sales)/i.test(text)) interests.push("Business", "Leadership");
  if (/(security|cyber)/i.test(text)) interests.push("Security");
  if (/(automation|devops|cloud)/i.test(text)) interests.push("Automation", "Technology");

  const uniqueInterests = interests.filter(
    (item, idx, arr) => arr.findIndex((v) => v.toLowerCase() === item.toLowerCase()) === idx,
  );

  return {
    name,
    email,
    phone: normalizeSpaces(phone),
    linkedin,
    github,
    website,
    skills,
    targetCareer: targetCareer
      .split(" ")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" "),
    fieldOfStudy,
    interests: uniqueInterests,
    education,
  };
};

const mergeExtractedIntoProfile = (profile, extracted) => {
  if (!profile.phone && extracted.phone) profile.phone = extracted.phone;
  if (!profile.linkedin && extracted.linkedin) profile.linkedin = extracted.linkedin;
  if (!profile.github && extracted.github) profile.github = extracted.github;
  if (!profile.website && extracted.website) profile.website = extracted.website;
  if (!profile.targetCareer && extracted.targetCareer) profile.targetCareer = extracted.targetCareer;
  if (!profile.fieldOfStudy && extracted.fieldOfStudy) profile.fieldOfStudy = extracted.fieldOfStudy;

  const existingInterests = new Set((profile.interests || []).map((i) => String(i).toLowerCase()));
  const mergedInterests = [...(profile.interests || [])];
  for (const interest of extracted.interests || []) {
    if (!existingInterests.has(String(interest).toLowerCase())) {
      mergedInterests.push(interest);
      existingInterests.add(String(interest).toLowerCase());
    }
  }
  profile.interests = mergedInterests;

  const existingSkills = new Set((profile.skills || []).map((s) => String(s.name).toLowerCase()));
  const mergedSkills = [...(profile.skills || [])];
  for (const skill of extracted.skills || []) {
    if (!existingSkills.has(String(skill).toLowerCase())) {
      mergedSkills.push({ name: skill, level: 6, category: "technical", yearsOfExperience: 0 });
      existingSkills.add(String(skill).toLowerCase());
    }
  }
  profile.skills = mergedSkills;

  const existingEducation = new Set(
    (profile.education || []).map((edu) => `${String(edu.institution || "").toLowerCase()}|${String(edu.degree || "").toLowerCase()}`),
  );
  const mergedEducation = [...(profile.education || [])];
  for (const entry of extracted.education || []) {
    const key = `${String(entry.institution || "").toLowerCase()}|${String(entry.degree || "").toLowerCase()}`;
    if (!existingEducation.has(key)) {
      mergedEducation.push(entry);
      existingEducation.add(key);
    }
  }
  profile.education = mergedEducation;

  return profile;
};

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

    // Use findOneAndUpdate with $set to avoid Mongoose VersionError
    // caused by rapid concurrent saves (e.g. add skill then remove quickly)
    let profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $set: { skills } },
      { new: true, upsert: true }
    );

    // Recompute completionPercentage (pre-save hook doesn't fire on findOneAndUpdate)
    const fields = [
      profile.bio,
      profile.location,
      profile.skills?.length > 0,
      profile.interests?.length > 0,
      profile.education?.length > 0,
      profile.targetCareer,
      profile.careerGoals,
      profile.fieldOfStudy,
    ];
    const pct = Math.round(fields.filter(Boolean).length / fields.length * 100);
    await Profile.findByIdAndUpdate(profile._id, { $set: { completionPercentage: pct } });

    await ActivityLog.create({
      user: req.user._id,
      action: "skill_update",
      description: `Updated ${skills.length} skills`,
    }).catch(() => {});

    res.json({
      message: "Skills updated successfully",
      skills: profile.skills,
      completionPercentage: pct,
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
    const autoFill = req.query.autoFill !== "false";

    let extracted = {
      skills: [],
      interests: [],
      education: [],
      targetCareer: "",
      fieldOfStudy: "",
      phone: "",
      linkedin: "",
      github: "",
      website: "",
    };

    try {
      const rawText = await extractTextFromResume(req.file.path, req.file.originalname);
      if (rawText) {
        extracted = parseResumeDetails(rawText);
      }
    } catch (parseError) {
      console.error("Resume parse warning:", parseError.message);
    }

    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    profile.resumeUrl = resumeUrl;
    profile.resumeOriginalName = req.file.originalname;

    if (autoFill) {
      profile = mergeExtractedIntoProfile(profile, extracted);
      profile.markModified("skills");
      profile.markModified("interests");
      profile.markModified("education");
    }

    await profile.save();
    await profile.populate("user", "name email avatar");

    await ActivityLog.create({
      user: req.user._id,
      action: "resume_uploaded",
      description: `Uploaded resume: ${req.file.originalname}`,
    });

    res.json({
      message: autoFill
        ? "Resume uploaded and profile auto-filled successfully"
        : "Resume uploaded successfully",
      resumeUrl,
      originalName: req.file.originalname,
      autoFilled: autoFill,
      extracted,
      profile,
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
