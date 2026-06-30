const express = require("express");
const router = express.Router();
const {
	chatWithBot,
	interviewTurn,
	getChatHistory,
	clearChatHistory,
	getInterviewSessions,
	startInterviewSession,
	finishInterviewSession,
} = require("../controllers/chatbotController");
const { protect } = require("../middleware/authMiddleware");

// POST /api/chatbot
router.get("/history", protect, getChatHistory);
router.delete("/history", protect, clearChatHistory);
router.get("/interview-history", protect, getInterviewSessions);
router.post("/interview-session", protect, startInterviewSession);
router.patch("/interview-session/:sessionId/complete", protect, finishInterviewSession);
router.post("/", protect, chatWithBot);
router.post("/interview-turn", protect, interviewTurn);

module.exports = router;
