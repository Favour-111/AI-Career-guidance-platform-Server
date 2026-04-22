const express = require("express");
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updatePreferences,
  markNotificationRead,
  registerValidators,
  loginValidators,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/register", authLimiter, registerValidators, register);
router.post("/login", authLimiter, loginValidators, login);
router.post("/refresh", refreshToken);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.patch("/preferences", protect, updatePreferences);
router.patch("/notifications/:id/read", protect, markNotificationRead);

module.exports = router;
