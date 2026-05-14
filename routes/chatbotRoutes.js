const express = require("express");
const router = express.Router();
const {
	chatWithBot,
	interviewTurn,
	getChatHistory,
	clearChatHistory,
} = require("../controllers/chatbotController");
const { protect } = require("../middleware/authMiddleware");

// POST /api/chatbot
router.get("/history", protect, getChatHistory);
router.delete("/history", protect, clearChatHistory);
router.post("/", protect, chatWithBot);
router.post("/interview-turn", protect, interviewTurn);

module.exports = router;
