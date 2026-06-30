const axios = require("axios");
const ChatSession = require("../models/ChatSession");
const InterviewSession = require("../models/InterviewSession");
const Profile = require("../models/Profile");
const MarketData = require("../models/MarketData");
const { buildMlServiceUrl } = require("../config/mlService");
const {
  buildCareerInsights,
  findCareerMatch,
} = require("../utils/marketInsights");

const GROQ_API_BASE_URL = process.env.GROQ_API_BASE_URL || "https://api.groq.com/openai/v1";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const CHAT_HISTORY_LIMIT = 12;
const PROFILE_SKILL_LIMIT = 8;
const PROFILE_INTEREST_LIMIT = 6;
const INTERVIEW_HISTORY_LIMIT = 6;

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s/+-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const uniqueStrings = (values = []) => [
  ...new Set(
    values
      .filter(Boolean)
      .map((value) => String(value).trim())
      .filter(Boolean),
  ),
];

const formatCurrency = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  if (number >= 1_000_000) return `₦${(number / 1_000_000).toFixed(1)}M`;
  if (number >= 1_000) return `₦${Math.round(number / 1_000)}k`;
  return `₦${Math.round(number)}`;
};

const normalizeLabel = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const inferInterviewRole = (profile = {}) => {
  const raw = normalizeLabel(profile?.targetCareer || profile?.fieldOfStudy || "");
  const skillBlob = normalizeLabel(
    (profile?.skills || [])
      .map((skill) => skill?.name)
      .filter(Boolean)
      .join(" "),
  );
  const haystack = `${raw} ${skillBlob}`;

  const roleMap = [
    {
      key: "software",
      label: "Software Engineer",
      keywords: ["software engineer", "software developer", "full stack", "programming", "algorithms", "system design", "debugging"],
    },
    {
      key: "frontend",
      label: "Frontend Developer",
      keywords: ["frontend", "front end", "ui developer", "react", "next", "vue", "angular"],
    },
    {
      key: "backend",
      label: "Backend Developer",
      keywords: ["backend", "back end", "api developer", "node", "django", "flask", "spring", "express"],
    },
    {
      key: "data",
      label: "Data Analyst / Data Scientist",
      keywords: ["data analyst", "data scientist", "analytics", "power bi", "tableau", "sql", "python", "excel"],
    },
    {
      key: "product",
      label: "Product / Business Analyst",
      keywords: ["product manager", "business analyst", "product analyst", "strategy", "product"],
    },
    {
      key: "devops",
      label: "DevOps / Cloud Engineer",
      keywords: ["devops", "cloud", "site reliability", "sre", "kubernetes", "docker", "aws", "azure", "gcp"],
    },
  ];

  const match = roleMap.find((item) => item.keywords.some((keyword) => haystack.includes(normalizeLabel(keyword))));
  return match || { key: "general", label: "General Career Interview" };
};

const inferInterviewDifficulty = (profile = {}) => {
  const experienceYears = (profile?.experience || []).reduce((sum, item) => {
    const start = item?.startDate ? new Date(item.startDate) : null;
    const end = item?.endDate ? new Date(item.endDate) : null;
    if (!start) return sum;

    const finish = end || new Date();
    const diffYears = Math.max(0, (finish - start) / (1000 * 60 * 60 * 24 * 365.25));
    return sum + diffYears;
  }, 0);

  const skillCount = Array.isArray(profile?.skills) ? profile.skills.length : 0;
  const completion = Number(profile?.completionPercentage || 0);

  if (experienceYears >= 4 || skillCount >= 12 || completion >= 75) {
    return "advanced";
  }
  if (experienceYears >= 1.5 || skillCount >= 6 || completion >= 45) {
    return "intermediate";
  }
  return "beginner";
};

const buildInterviewProfileSnapshot = (profile = {}) => ({
  targetCareer: profile?.targetCareer || "",
  fieldOfStudy: profile?.fieldOfStudy || "",
  interests: uniqueStrings(profile?.interests || []).slice(0, 8),
  skills: uniqueStrings((profile?.skills || []).map((skill) => skill?.name)).slice(0, 12),
  experienceLevel: inferInterviewDifficulty(profile),
  experienceCount: Array.isArray(profile?.experience) ? profile.experience.length : 0,
});

const buildCareerContext = ({ profile, careerInsights }) => {
  const skills = uniqueStrings(
    (profile?.skills || [])
      .map((skill) => skill?.name)
      .filter(Boolean),
  ).slice(0, PROFILE_SKILL_LIMIT);
  const interests = uniqueStrings(profile?.interests || []).slice(0, PROFILE_INTEREST_LIMIT);

  const lines = [];
  if (profile?.targetCareer) lines.push(`Target career: ${profile.targetCareer}`);
  if (profile?.fieldOfStudy) lines.push(`Field of study: ${profile.fieldOfStudy}`);
  if (profile?.location) lines.push(`Location: ${profile.location}`);
  if (skills.length) lines.push(`Current skills: ${skills.join(", ")}`);
  if (interests.length) lines.push(`Interests: ${interests.join(", ")}`);

  if (careerInsights) {
    lines.push(`Market match: ${careerInsights.title}`);
    if (careerInsights.category) lines.push(`Market category: ${careerInsights.category}`);
    if (careerInsights.demandLevel) lines.push(`Demand level: ${careerInsights.demandLevel}`);
    if (careerInsights.growthRate != null) lines.push(`Growth rate: ${careerInsights.growthRate}%`);
    if (careerInsights.averageSalary?.mid) {
      const salary = formatCurrency(careerInsights.averageSalary.mid);
      if (salary) lines.push(`Typical mid-level salary: ${salary} per year`);
    }
    const trendingSkills = uniqueStrings(careerInsights.trendingSkills || []).slice(0, 6);
    if (trendingSkills.length) lines.push(`Trending skills: ${trendingSkills.join(", ")}`);
    const topCompanies = uniqueStrings(careerInsights.topHiringCompanies || []).slice(0, 5);
    if (topCompanies.length) lines.push(`Top hiring companies: ${topCompanies.join(", ")}`);
    const certifications = uniqueStrings(
      (careerInsights.certifications || []).map((item) => item?.name),
    ).slice(0, 4);
    if (certifications.length) lines.push(`Helpful certifications: ${certifications.join(", ")}`);
    const learningPaths = uniqueStrings(
      (careerInsights.learningPaths || []).map((item) => item?.title),
    ).slice(0, 3);
    if (learningPaths.length) lines.push(`Learning resources: ${learningPaths.join(", ")}`);
    if (careerInsights.hiringTrend) lines.push(`Hiring trend: ${careerInsights.hiringTrend}`);
  }

  return lines.join("\n");
};

const buildLocalReply = (message, profile = null, careerInsights = null) => {
  const text = message.trim().toLowerCase();
  const targetCareer = profile?.targetCareer || careerInsights?.title || "your target career";
  const topSkills = uniqueStrings(
    (careerInsights?.topSkills || profile?.skills || [])
      .map((skill) => skill?.name || skill)
      .filter(Boolean),
  ).slice(0, 5);
  const trendingSkills = uniqueStrings(careerInsights?.trendingSkills || []).slice(0, 5);
  const certifications = uniqueStrings(
    (careerInsights?.certifications || []).map((item) => item?.name),
  ).slice(0, 4);

  if (/^(hi|hello|hey|good\s?(morning|afternoon|evening))\b/.test(text)) {
    if (profile?.targetCareer) {
      return `Hello. I already have your profile for ${targetCareer}. Ask me about skills, certifications, interview prep, salary expectations, or market trends for that path.`;
    }
    return "Hello. I can help with your career goals, tech stack, skills, or interview preparation. If you complete your profile, I can tailor every answer to your career automatically.";
  }

  if (text.includes("interview")) {
    if (profile?.targetCareer) {
      return `For ${targetCareer} interview prep, I can ask realistic questions, review your answers, and suggest stronger responses based on your profile and market trends.`;
    }
    return "For interview prep, give me your target role and I’ll ask realistic follow-up questions, review your answers, and suggest stronger responses.";
  }

  if (text.includes("skill") || text.includes("technology") || text.includes("stack") || text.includes("framework")) {
    if (profile?.targetCareer) {
      const skillList = topSkills.length ? topSkills.join(", ") : "the core skills in your field";
      const trendList = trendingSkills.length ? `Current market signals also favor ${trendingSkills.join(", ")}.` : "";
      return `For ${targetCareer}, the next skills I’d focus on are ${skillList}. ${trendList} If you want, I can turn that into a 30-day learning plan.`;
    }
    return "Share your current skills or tech stack, and I’ll suggest what to improve next, which tools to learn, and how to position your strengths for the role you want.";
  }

  if (text.includes("certif")) {
    if (profile?.targetCareer) {
      return certifications.length
        ? `For ${targetCareer}, useful certifications include ${certifications.join(", ")}. I can also rank them by value and difficulty if you want.`
        : `For ${targetCareer}, I can suggest certifications once I can match your profile to a market career record.`;
    }
    return "If you tell me your target role, I’ll suggest certifications that make sense for that path.";
  }

  if (text.includes("salary") || text.includes("pay")) {
    if (careerInsights?.averageSalary?.mid) {
      const salary = formatCurrency(careerInsights.averageSalary.mid);
      return `For ${targetCareer}, the current market snapshot suggests a mid-level salary around ${salary || "the current market range"} per year in Nigeria.`;
    }
    if (profile?.targetCareer) {
      return `For ${targetCareer}, I can estimate salary expectations once I find a stronger market match for your profile.`;
    }
    return "Tell me your target role and I’ll help you interpret salary expectations in context.";
  }

  if (text.includes("market") || text.includes("trend")) {
    if (careerInsights?.hiringTrend || trendingSkills.length) {
      const trendLine = careerInsights.hiringTrend ? `Hiring trend: ${careerInsights.hiringTrend}.` : "";
      const skillLine = trendingSkills.length ? `Trending skills: ${trendingSkills.join(", ")}.` : "";
      return `For ${targetCareer}, here’s the market snapshot I’m using right now. ${trendLine} ${skillLine}`.trim();
    }
    if (profile?.targetCareer) {
      return `I have your ${targetCareer} profile, but I need a closer market record before I can give a precise trend view. Ask me about skills, certifications, or interview prep in the meantime.`;
    }
    return "Tell me your target role and I’ll summarize the market trends for that path.";
  }

  if (text.includes("career") || text.includes("job") || text.includes("role")) {
    if (profile?.targetCareer) {
      return `For ${targetCareer}, I can help you compare options, identify skill gaps, and plan your next steps without you repeating the role each time.`;
    }
    return "Tell me the career path or role you want, and I’ll help you compare options, identify skill gaps, and plan your next steps.";
  }

  if (profile?.targetCareer) {
    return `I’m already working from your ${targetCareer} profile. Ask me about skills, certifications, interviews, salary, learning resources, or market trends and I’ll tailor the answer to that path.`;
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

const loadRecentChatMessages = async (userId) => {
  const session = await ChatSession.findOne({ user: userId })
    .select("messages")
    .lean();

  return Array.isArray(session?.messages)
    ? session.messages
        .slice(-CHAT_HISTORY_LIMIT)
        .map((message) => ({
          role: message.role === "candidate" ? "user" : message.role === "interviewer" ? "assistant" : message.role,
          content: String(message.content || "").trim(),
        }))
        .filter((message) => message.content)
    : [];
};

const buildCareerSnapshot = async (profile, clientContext = {}) => {
  const mergedProfile = {
    targetCareer:
      profile?.targetCareer ||
      clientContext?.targetCareer ||
      "",
    fieldOfStudy:
      profile?.fieldOfStudy ||
      clientContext?.fieldOfStudy ||
      "",
    location: profile?.location || clientContext?.location || "",
    interests: uniqueStrings([
      ...(Array.isArray(profile?.interests) ? profile.interests : []),
      ...(Array.isArray(clientContext?.interests) ? clientContext.interests : []),
    ]).slice(0, PROFILE_INTEREST_LIMIT),
    skills: uniqueStrings([
      ...((Array.isArray(profile?.skills) ? profile.skills : []).map((skill) => skill?.name)),
      ...((Array.isArray(clientContext?.skills) ? clientContext.skills : []).map((skill) => skill?.name || skill)),
    ]).slice(0, PROFILE_SKILL_LIMIT),
  };

  const marketCareers = mergedProfile.targetCareer
    ? await MarketData.find({ region: "Nigeria" }).lean()
    : [];
  const marketCareer = mergedProfile.targetCareer
    ? findCareerMatch(mergedProfile.targetCareer, marketCareers)
    : null;
  const careerInsights = marketCareer ? buildCareerInsights(marketCareer) : null;

  return {
    profile: mergedProfile,
    marketCareer: careerInsights,
    contextText: buildCareerContext({ profile: mergedProfile, careerInsights }),
  };
};

const callMlInterviewTurn = async (payload) => {
  const response = await axios.post(buildMlServiceUrl("/interview-turn"), payload, {
    timeout: 12000,
    headers: { "Content-Type": "application/json" },
  });

  return response.data;
};

const summarizeInterviewTurns = (turns = []) => {
  if (!Array.isArray(turns) || turns.length === 0) {
    return {
      overallScore: 0,
      averageLength: 0,
      strongestArea: "",
      weakestArea: "",
      recommendations: [],
      sampleAnswer: "",
    };
  }

  const scores = turns.map((turn) => Number(turn?.score)).filter((score) => Number.isFinite(score));
  const lengths = turns.map((turn) => String(turn?.answer || "").split(/\s+/).filter(Boolean).length);
  const averageScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  const averageLength = lengths.length ? Math.round(lengths.reduce((sum, len) => sum + len, 0) / lengths.length) : 0;
  const strongestAreaTurn = turns.reduce((best, turn) => {
    if (!best) return turn;
    const currentScore = Number(turn?.score) || 0;
    const bestScore = Number(best?.score) || 0;
    return currentScore >= bestScore ? turn : best;
  }, null);
  const weakestAreaTurn = turns.reduce((worst, turn) => {
    if (!worst) return turn;
    const currentScore = Number(turn?.score) || 0;
    const worstScore = Number(worst?.score) || 0;
    return currentScore <= worstScore ? turn : worst;
  }, null);

  const recommendations = uniqueStrings(
    turns.flatMap((turn) => [
      ...(Array.isArray(turn?.improvements) ? turn.improvements : []),
      turn?.followUpQuestion ? `Practice answering: ${turn.followUpQuestion}` : null,
    ]),
  ).slice(0, INTERVIEW_HISTORY_LIMIT);

  return {
    overallScore: averageScore,
    averageLength,
    strongestArea: strongestAreaTurn?.technical || strongestAreaTurn?.communication || "",
    weakestArea: weakestAreaTurn?.technical || weakestAreaTurn?.communication || "",
    recommendations,
    sampleAnswer: turns[turns.length - 1]?.suggestedAnswer || "",
  };
};

const formatInterviewSession = (session) => ({
  id: session._id,
  roleKey: session.roleKey,
  targetCareer: session.targetCareer,
  focus: session.focus,
  difficulty: session.difficulty,
  status: session.status,
  turns: session.turns || [],
  summary: session.summary || null,
  initialQuestion: session.initialQuestion || "",
  profileSnapshot: session.profileSnapshot || null,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
  completedAt: session.completedAt || null,
});

const focusByRole = {
  software: "Programming fundamentals, algorithms, system design, debugging, and shipping reliable software.",
  frontend: "UI architecture, React patterns, performance, accessibility, and product thinking.",
  backend: "APIs, system design, reliability, data modeling, security, and scalability.",
  data: "Experiment design, insights, metrics, trade-offs, data quality, and business impact.",
  product: "Prioritization, communication, stakeholder management, metrics, and customer empathy.",
  devops: "Automation, infrastructure, deployment reliability, observability, and incident response.",
  general: "Communication, ownership, motivation, growth mindset, and role fit.",
};

const buildInterviewSessionRecord = async ({ userId, profile, customQuestion = "" }) => {
  const role = inferInterviewRole(profile || {});
  const difficulty = inferInterviewDifficulty(profile || {});
  const profileSnapshot = buildInterviewProfileSnapshot(profile || {});
  return InterviewSession.create({
    user: userId,
    targetCareer: profile?.targetCareer || role.label,
    roleKey: role.key,
    focus: focusByRole[role.key] || focusByRole.general,
    difficulty,
    profileSnapshot,
    initialQuestion: customQuestion.trim(),
    status: "active",
    turns: [],
    summary: null,
    lastTurnAt: new Date(),
  });
};

// @desc    Get interview session history for current user
// @route   GET /api/chatbot/interview-history
// @access  Private
exports.getInterviewSessions = async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    return res.json({
      sessions: sessions.map(formatInterviewSession),
    });
  } catch (err) {
    console.error("Get interview sessions error:", err.message);
    return res.status(500).json({ error: "Unable to load interview history." });
  }
};

// @desc    Start a new interview session
// @route   POST /api/chatbot/interview-session
// @access  Private
exports.startInterviewSession = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id })
      .select("targetCareer fieldOfStudy interests skills experience completionPercentage")
      .lean();

    const customQuestion = typeof req.body?.customQuestion === "string" ? req.body.customQuestion : "";
    const session = await buildInterviewSessionRecord({
      userId: req.user._id,
      profile,
      customQuestion,
    });

    return res.status(201).json({
      message: "Interview session created.",
      session: formatInterviewSession(session),
      autoDetectedCareer: profile?.targetCareer || session.targetCareer,
      detectedRoleKey: session.roleKey,
      difficulty: session.difficulty,
      profileSnapshot: session.profileSnapshot,
      openingQuestion: customQuestion.trim() || "",
    });
  } catch (err) {
    console.error("Create interview session error:", err.message);
    return res.status(500).json({ error: "Unable to start interview session." });
  }
};

// @desc    Complete an interview session
// @route   PATCH /api/chatbot/interview-session/:sessionId/complete
// @access  Private
exports.finishInterviewSession = async (req, res) => {
  try {
    const session = await InterviewSession.findOne({
      _id: req.params.sessionId,
      user: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ error: "Interview session not found." });
    }

    session.status = "completed";
    session.completedAt = new Date();
    session.summary = summarizeInterviewTurns(session.turns);
    await session.save();

    return res.json({
      message: "Interview session completed.",
      session: formatInterviewSession(session),
    });
  } catch (err) {
    console.error("Complete interview session error:", err.message);
    return res.status(500).json({ error: "Unable to complete interview session." });
  }
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
  let resolvedProfile = null;
  let marketCareer = null;
  let contextText = "";
  let recentMessages = [];
  let fallbackReply = "";

  try {
    const { message } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }

    const normalizedMessage = message.trim();
    if (!normalizedMessage) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    const profile = await Profile.findOne({ user: req.user._id })
      .select("targetCareer fieldOfStudy interests skills location careerGoals")
      .lean();
    const clientContext = req.body?.context && typeof req.body.context === "object" ? req.body.context : {};
    ({
      profile: resolvedProfile,
      marketCareer,
      contextText,
    } = await buildCareerSnapshot(profile, clientContext));
    recentMessages = await loadRecentChatMessages(req.user._id);
    fallbackReply = buildLocalReply(normalizedMessage, resolvedProfile, marketCareer);

    let reply = "";
    let warning = null;
    let fallback = false;
    let errorDetails = null;
    
    try {
      reply = await callGroqChat({
        messages: [
          {
            role: "system",
            content:
              "You are a professional AI career coach. Give practical, role-specific guidance on skills, career growth, interview prep, salary expectations, certifications, and technology choices. Keep responses concise but useful.",
          },
          {
            role: "system",
            content: [
              "You are speaking to a signed-in user with the following saved career context:",
              contextText || "No saved career profile was found.",
              "Instructions:",
              "- Use the saved career profile and recent chat history as the default context.",
              "- Do not ask the user to repeat their career unless no profile exists.",
              "- If the user asks a generic question, answer it through the lens of their saved career.",
              "- If the profile is incomplete, answer generally and suggest profile completion only when needed.",
              "- Keep the conversation natural and continue from prior messages when relevant.",
            ].join("\n"),
          },
          ...recentMessages,
          { role: "user", content: normalizedMessage },
        ],
        temperature: 0.5,
        maxTokens: 500,
      });
    } catch (groqError) {
      console.error("Groq chatbot error:", groqError.message);
      errorDetails = `Groq failed: ${groqError.message}`;
      try {
        console.log(`[DEBUG] Attempting ML Service call to: ${buildMlServiceUrl("/chatbot")}`);
        const mlResponse = await axios.post(
          buildMlServiceUrl("/chatbot"),
          {
            message: normalizedMessage,
            context: resolvedProfile,
            careerContext: contextText,
            history: recentMessages,
          },
          { timeout: 12000 },
        );
        reply = mlResponse.data?.reply || "";
        console.log("[DEBUG] ML Service succeeded");
      } catch (mlError) {
        console.error("ML chatbot fallback error:", {
          message: mlError.message,
          status: mlError.response?.status,
          statusText: mlError.response?.statusText,
          url: buildMlServiceUrl("/chatbot"),
          data: mlError.response?.data,
        });
        errorDetails += ` | ML Service failed: ${mlError.message} (Status: ${mlError.response?.status || 'no response'})`;
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

    const response = { reply, warning, fallback };
    if (process.env.NODE_ENV === "development" && errorDetails) {
      response.errorDetails = errorDetails;
    }
    return res.json(response);
  } catch (err) {
    console.error("Chatbot error:", err.message);

    fallbackReply = buildLocalReply(req.body?.message || "", resolvedProfile, marketCareer);

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
    const {
      role,
      roleKey,
      focus,
      difficulty,
      question,
      answer,
      sessionId,
      history = [],
      fieldOfStudy,
      targetCareer,
      interests = [],
      skills = [],
    } = req.body || {};

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

    const savedProfile = await Profile.findOne({ user: req.user._id })
      .select("fieldOfStudy targetCareer interests skills location")
      .lean();
    const interviewSession = sessionId
      ? await InterviewSession.findOne({ _id: sessionId, user: req.user._id })
      : null;

    const mergedFieldOfStudy =
      (typeof fieldOfStudy === "string" && fieldOfStudy.trim()) ||
      (typeof savedProfile?.fieldOfStudy === "string" && savedProfile.fieldOfStudy.trim()) ||
      (typeof interviewSession?.profileSnapshot?.fieldOfStudy === "string" && interviewSession.profileSnapshot.fieldOfStudy.trim()) ||
      "";
    const mergedTargetCareer =
      (typeof targetCareer === "string" && targetCareer.trim()) ||
      (typeof savedProfile?.targetCareer === "string" && savedProfile.targetCareer.trim()) ||
      (typeof interviewSession?.targetCareer === "string" && interviewSession.targetCareer.trim()) ||
      "";

    const mergedInterests = [
      ...(Array.isArray(interests) ? interests : []),
      ...(Array.isArray(savedProfile?.interests) ? savedProfile.interests : []),
      ...(Array.isArray(interviewSession?.profileSnapshot?.interests) ? interviewSession.profileSnapshot.interests : []),
    ]
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .filter((item, idx, arr) => arr.findIndex((v) => v.toLowerCase() === item.toLowerCase()) === idx)
      .slice(0, 10);

    const mergedSkills = [
      ...(Array.isArray(skills) ? skills : []),
      ...((savedProfile?.skills || []).map((s) => s?.name) || []),
      ...(Array.isArray(interviewSession?.profileSnapshot?.skills) ? interviewSession.profileSnapshot.skills : []),
    ]
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .filter((item, idx, arr) => arr.findIndex((v) => v.toLowerCase() === item.toLowerCase()) === idx)
      .slice(0, 12);

    const candidateContext = [
      mergedFieldOfStudy ? `Field of study: ${mergedFieldOfStudy}` : null,
      mergedTargetCareer ? `Target career: ${mergedTargetCareer}` : null,
      mergedInterests.length ? `Interests: ${mergedInterests.join(", ")}` : null,
      mergedSkills.length ? `Top skills: ${mergedSkills.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const serializedHistory = Array.isArray(history)
      ? history.slice(-6).map((h) => `Q: ${h.question || ""}\nA: ${h.answer || ""}`).join("\n\n")
      : "";
    const effectiveDifficulty = typeof difficulty === "string" && difficulty.trim()
      ? difficulty.trim()
      : interviewSession?.difficulty || inferInterviewDifficulty(savedProfile || {});
    const effectiveRole = role || interviewSession?.targetCareer || inferInterviewRole(savedProfile || {}).label;

    let parsed = null;
    let usedMlFallback = false;
    let errorDetails = null;

    try {
      const content = await callGroqChat({
        messages: [
          {
            role: "system",
            content:
              "You are a senior interviewer. Evaluate answers realistically and return strict JSON only. JSON keys: score (number 0-100), communication (string), technical (string), strengths (string array), improvements (string array), suggestedAnswer (string), followUpQuestion (string). If candidate context has a field of study or target career, the followUpQuestion must be specific to that field/career and not generic.",
          },
          {
            role: "user",
            content: `Role: ${effectiveRole || "General"}\nRole key: ${roleKey || interviewSession?.roleKey || "general"}\nDifficulty: ${effectiveDifficulty || "intermediate"}\nFocus: ${focus || interviewSession?.focus || "General interview performance"}\nCandidate context:\n${candidateContext || "None"}\nCurrent question: ${question}\nCandidate answer: ${trimmedAnswer}\nRecent context:\n${serializedHistory || "None"}\n\nReturn strict JSON only with the required keys. Make the follow-up question match the role, difficulty, and candidate context.`,
          },
        ],
        temperature: 0.35,
        maxTokens: 700,
      });

      parsed = tryParseJson(content);
    } catch (groqError) {
      console.error("Groq interview error:", groqError.message);
      errorDetails = `Groq failed: ${groqError.message}`;
      try {
        const mlUrl = buildMlServiceUrl("/interview-turn");
        console.log(`[DEBUG] Attempting ML Service interview call to: ${mlUrl}`);
        parsed = await callMlInterviewTurn({
          role,
          focus,
          roleKey,
          difficulty: effectiveDifficulty,
          question,
          answer: trimmedAnswer,
          fieldOfStudy: mergedFieldOfStudy,
          targetCareer: mergedTargetCareer,
          interests: mergedInterests,
          skills: mergedSkills,
        });
        usedMlFallback = true;
        console.log("[DEBUG] ML Service interview succeeded");
      } catch (mlError) {
        console.error("ML interview fallback error:", {
          message: mlError.message,
          status: mlError.response?.status,
          statusText: mlError.response?.statusText,
          url: buildMlServiceUrl("/interview-turn"),
          data: mlError.response?.data,
        });
        errorDetails += ` | ML Service failed: ${mlError.message} (Status: ${mlError.response?.status || 'no response'})`;
      }
    }

    if (!parsed) {
      const fallback = buildInterviewFallback({ role: effectiveRole || role, question, answer: trimmedAnswer });
      return res.json({ 
        ...fallback, 
        fallback: true, 
        warning: "AI response format issue, using fallback analysis.",
        ...(process.env.NODE_ENV === "development" && { errorDetails })
      });
    }

    let followUpQuestion =
      typeof parsed.followUpQuestion === "string"
        ? parsed.followUpQuestion
        : "Can you give a concrete example with measurable impact?";

    if (mergedFieldOfStudy && !new RegExp(mergedFieldOfStudy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(followUpQuestion)) {
      followUpQuestion = `In ${mergedFieldOfStudy}, ${followUpQuestion.charAt(0).toLowerCase()}${followUpQuestion.slice(1)}`;
    }

    const normalized = {
      score: Number.isFinite(Number(parsed.score)) ? Math.max(0, Math.min(100, Math.round(Number(parsed.score)))) : 60,
      communication: typeof parsed.communication === "string" ? parsed.communication : "Developing",
      technical: typeof parsed.technical === "string" ? parsed.technical : "Moderate",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter((s) => typeof s === "string").slice(0, 5) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.filter((s) => typeof s === "string").slice(0, 6) : [],
      suggestedAnswer: typeof parsed.suggestedAnswer === "string" ? parsed.suggestedAnswer : "Use STAR and include measurable impact.",
      followUpQuestion,
    };

    if (interviewSession) {
      interviewSession.turns.push({
        question,
        answer: trimmedAnswer,
        score: normalized.score,
        communication: normalized.communication,
        technical: normalized.technical,
        strengths: normalized.strengths,
        improvements: normalized.improvements,
        suggestedAnswer: normalized.suggestedAnswer,
        followUpQuestion: normalized.followUpQuestion,
      });
      interviewSession.lastTurnAt = new Date();
      interviewSession.summary = summarizeInterviewTurns(interviewSession.turns);
      await interviewSession.save();
    }

    return res.json({
      ...normalized,
      fallback: usedMlFallback,
      warning: usedMlFallback ? "Primary AI unavailable; using ML service interview analysis." : null,
    });
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
