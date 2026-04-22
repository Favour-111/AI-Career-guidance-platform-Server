const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { protect } = require("../middleware/authMiddleware");
const {
  getProfile,
  upsertProfile,
  updateSkills,
  uploadResume,
  toggleBookmark,
} = require("../controllers/profileController");
const ActivityLog = require("../models/ActivityLog");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/resumes/"),
  filename: (req, file, cb) => {
    const unique = `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
    }
  },
});

router.get("/", protect, getProfile);
router.post("/", protect, upsertProfile);
router.put("/skills", protect, updateSkills);
router.post("/resume", protect, upload.single("resume"), uploadResume);
router.post("/bookmark", protect, toggleBookmark);
router.get("/activity", protect, async (req, res) => {
  const logs = await ActivityLog.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .select("action description createdAt")
    .lean();
  res.json({ activities: logs });
});

module.exports = router;
