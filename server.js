require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const path = require("path");

const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const { globalLimiter } = require("./middleware/rateLimiter");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const marketRoutes = require("./routes/marketRoutes");
const adminRoutes = require("./routes/adminRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");

connectDB();

const app = express();

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "https://ai-career-guidance-platform-fronten-theta.vercel.app",
  "https://ai-career-guidance-platform-frontend-theta.vercel.app",
];

const allowedOrigins = [
  ...defaultAllowedOrigins,
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

/*
=========================
Security
=========================
*/

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

/*
=========================
CORS
=========================
*/

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/*
=========================
Body Parser
=========================
*/

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(mongoSanitize());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(globalLimiter);

/*
=========================
Static
=========================
*/

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads"),
  ),
);

/*
=========================
Health
=========================
*/

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
  });
});

/*
=========================
Routes
=========================
*/

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chatbot", chatbotRoutes);

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  const PORT = process.env.PORT || 5001;

  app.listen(PORT, () => {
    console.log(`Running on ${PORT}`);
  });
}

module.exports = app;
