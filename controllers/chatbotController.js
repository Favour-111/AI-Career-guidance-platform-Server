const axios = require("axios");
const ChatSession = require("../models/ChatSession");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const GROQ_API_BASE_URL = process.env.GROQ_API_BASE_URL || "https://api.groq.com/openai/v1";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const buildLocalReply = (message) => {
  const text = message.trim().toLowerCase();

  if (/^(hi|hello|hey|good\s?(morning|afternoon|evening))\b/.test(text)) {
    return "Hello. I can help with your career goals, tech stack, skills, or interview preparation. Tell me what role you are targeting and I’ll guide you from there.";
  }

  if (text.includes("interview")) {
    return "For interview prep, give me your target role and I’ll ask realistic follow-up questions, review your answers, and suggest stronger responses.";
  }

  if (text.includes("skill") || text.includes("technology") || text.includes("stack") || text.includes("framework")) {
    return "Share your current skills or tech stack, and I’ll suggest what to improve next, which tools to learn, and how to position your strengths for the role you want.";
  }

  if (text.includes("career") || text.includes("job") || text.includes("role")) {
    return "Tell me the career path or role you want, and I’ll help you compare options, identify skill gaps, and plan your next steps.";
  }

  return "I can help you with career advice, interview practice, tech stack guidance, and professional growth. Give me a bit more detail and I’ll respond with something specific.";
};

const buildInterviewFallback = ({ role, question, answer }) => {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  const concise = words < 45;
  const score = Math.max(35, Math.min(88, Math.round((words / 90) * 100)));
  const strengths = [
    "You stayed relevant to the question.",
  ];
  const improvements = [
    "Use a clearer STAR structure: situation, task, action, result.",
    "Add measurable impact or outcomes.",
  ];

  if (!concise) {
    strengths.push("You gave enough detail to start a meaningful evaluation.");
  } else {
    improvements.push("Expand your example with context and concrete decisions.");
  }

  return {
    score,
    communication: score >= 70 ? "Strong" : "Developing",
    technical: /api|react|sql|python|cloud|docker|architecture|performance/i.test(answer)
      ? "Moderate"
      : "Light",
    strengths,
    improvements,
    suggestedAnswer: `For a ${role || "target"} role, answer in 4 parts: context, your actions, the result, and what you learned. Question: ${question}`,
    followUpQuestion: "Can you walk me through one concrete example and quantify the impact?",
  };
};

const tryParseJson = (content) => {
  if (!content || typeof content !== "string") return null;
  try {
    return JSON.parse(content);
  } catch (_) {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(content.slice(start, end + 1));
      } catch (_) {
        return null;
      }
    }
    return null;
  }
};

const callGroqChat = async ({ messages, temperature = 0.4, maxTokens = 500 }) => {
  if (!GROQ_API_KEY) {
    const error = new Error("GROQ_API_KEY not configured");
    error.code = "GROQ_NOT_CONFIGURED";
    throw error;
  }

  const response = await axios.post(
    `${GROQ_API_BASE_URL}/chat/completions`,
    {
      model: GROQ_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    },
    {
      timeout: 20000,
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data?.choices?.[0]?.message?.content || "";
};

const appendChatMessages = async (userId, messages) => {
  const sanitizedMessages = (Array.isArray(messages) ? messages : [])
    .filter((message) => message && typeof message.content === "string" && message.content.trim())
    .map((message) => ({ role: message.role, content: message.content.trim() }));

  if (!sanitizedMessages.length) return;

  await ChatSession.findOneAndUpdate(
    { user: userId },
    {
      $push: {
        messages: {
          $each: sanitizedMessages,
          $slice: -200,
        },
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );
};

// @desc    Get chatbot history for current user
// @route   GET /api/chatbot/history
// @access  Private
exports.getChatHistory = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ user: req.user._id }).select("messages updatedAt");
    return res.json({
      messages: session?.messages || [],
      updatedAt: session?.updatedAt || null,
    });
  } catch (err) {
    console.error("Get chat history error:", err.message);
    return res.status(500).json({ error: "Unable to load chat history." });
  }
};

// @desc    Clear chatbot history for current user
// @route   DELETE /api/chatbot/history
// @access  Private
exports.clearChatHistory = async (req, res) => {
  try {
    await ChatSession.findOneAndUpdate(
      { user: req.user._id },
      { $set: { messages: [] } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return res.json({ message: "Chat history cleared." });
  } catch (err) {
    console.error("Clear chat history error:", err.message);
    return res.status(500).json({ error: "Unable to clear chat history." });
  }
};

// @desc    Handle AI chatbot conversation
// @route   POST /api/chatbot
// @access  Private (requires authentication)
exports.chatWithBot = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }

    const normalizedMessage = message.trim();
    if (!normalizedMessage) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    const fallbackReply = buildLocalReply(normalizedMessage);

    let reply = "";
    let warning = null;
    let fallback = false;
    try {
      reply = await callGroqChat({
        messages: [
          {
            role: "system",
            content:
              "You are a professional AI career coach. Give practical, role-specific guidance on skills, career growth, interview prep, and technology choices. Keep responses concise but useful.",
          },
          { role: "user", content: normalizedMessage },
        ],
        temperature: 0.5,
        maxTokens: 500,
      });
    } catch (groqError) {
      console.error("Groq chatbot error:", groqError.message);
      try {
        const mlResponse = await axios.post(
          `${ML_SERVICE_URL}/chatbot`,
          { message: normalizedMessage },
          { timeout: 12000 },
        );
        reply = mlResponse.data?.reply || "";
      } catch (mlError) {
        console.error("ML chatbot fallback error:", mlError.message);
      }
    }

    if (typeof reply !== "string" || !reply.trim()) {
      reply = fallbackReply;
      warning = "AI service temporarily unavailable; using local reply.";
      fallback = true;
    }

    try {
      await appendChatMessages(req.user._id, [
        { role: "user", content: normalizedMessage },
        { role: "assistant", content: reply },
      ]);
    } catch (saveError) {
      console.error("Chat save error:", saveError.message);
    }

    return res.json({ reply, warning, fallback });
  } catch (err) {
    console.error("Chatbot error:", err.message);

    const fallbackReply = buildLocalReply(req.body?.message || "");

    if (fallbackReply) {
      try {
        await appendChatMessages(req.user._id, [
          { role: "user", content: req.body?.message || "" },
          { role: "assistant", content: fallbackReply },
        ]);
      } catch (saveError) {
        console.error("Fallback chat save error:", saveError.message);
      }

      return res.json({
        reply: fallbackReply,
        fallback: true,
        warning: "AI service temporarily unavailable; using local reply.",
      });
    }

    return res.status(500).json({
      error: "AI chatbot service unavailable.",
      details: err.response?.data?.detail || err.response?.data?.message || err.message,
    });
  }
};

// @desc    Analyze interview answer and generate follow-up via Grok
// @route   POST /api/chatbot/interview-turn
// @access  Private
exports.interviewTurn = async (req, res) => {
  try {
    const { role, focus, question, answer, history = [] } = req.body || {};

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Question is required." });
    }
    if (!answer || typeof answer !== "string") {
      return res.status(400).json({ error: "Answer is required." });
    }

    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer) {
      return res.status(400).json({ error: "Answer cannot be empty." });
    }

    const serializedHistory = Array.isArray(history)
      ? history.slice(-6).map((h) => `Q: ${h.question || ""}\nA: ${h.answer || ""}`).join("\n\n")
      : "";

    const content = await callGroqChat({
      messages: [
        {
          role: "system",
          content:
            "You are a senior technical interviewer. Evaluate answers realistically and return strict JSON only. JSON keys: score (number 0-100), communication (string), technical (string), strengths (string array), improvements (string array), suggestedAnswer (string), followUpQuestion (string).",
        },
        {
          role: "user",
          content: `Role: ${role || "General"}\nFocus: ${focus || "General interview performance"}\nCurrent question: ${question}\nCandidate answer: ${trimmedAnswer}\nRecent context:\n${serializedHistory || "None"}\n\nReturn strict JSON only with the required keys.`,
        },
      ],
      temperature: 0.35,
      maxTokens: 700,
    });

    const parsed = tryParseJson(content);
    if (!parsed) {
      const fallback = buildInterviewFallback({ role, question, answer: trimmedAnswer });
      return res.json({ ...fallback, fallback: true, warning: "AI response format issue, using fallback analysis." });
    }

    const normalized = {
      score: Number.isFinite(Number(parsed.score)) ? Math.max(0, Math.min(100, Math.round(Number(parsed.score)))) : 60,
      communication: typeof parsed.communication === "string" ? parsed.communication : "Developing",
      technical: typeof parsed.technical === "string" ? parsed.technical : "Moderate",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter((s) => typeof s === "string").slice(0, 5) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.filter((s) => typeof s === "string").slice(0, 6) : [],
      suggestedAnswer: typeof parsed.suggestedAnswer === "string" ? parsed.suggestedAnswer : "Use STAR and include measurable impact.",
      followUpQuestion: typeof parsed.followUpQuestion === "string" ? parsed.followUpQuestion : "Can you give a concrete example with measurable impact?",
    };

    return res.json(normalized);
  } catch (err) {
    console.error("Interview turn error:", err.message);
    const fallback = buildInterviewFallback(req.body || {});
    return res.json({
      ...fallback,
      fallback: true,
      warning: "AI service unavailable, using fallback interview analysis.",
    });
  }
};
