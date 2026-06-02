require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const path = require("path");

const connectDB = require("./config/db");
const { ML_SERVICE_URL } = require("./config/mlService");
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

/*
=========================
SECURITY HEADERS FIRST
=========================
*/
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

/*
=========================
CORS (IMPORTANT: BEFORE ROUTES)
=========================
*/
const corsOptions = {
  origin: true, // allows ALL origins
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/*
=========================
BODY PARSERS
=========================
*/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
=========================
SECURITY MIDDLEWARE
=========================
*/
app.use(mongoSanitize());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(globalLimiter);

/*
=========================
STATIC FILES
=========================
*/
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/*
=========================
HEALTH CHECK
=========================
*/
app.get("/api/health", async (req, res) => {
  const axios = require("axios");
  const health = {
    success: true,
    backend: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    services: {
      ml: {
        url: ML_SERVICE_URL,
        status: "checking",
        responseTime: null,
        error: null,
      },
    },
  };

  try {
    const startTime = Date.now();
    const mlHealthResponse = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 5000,
    });
    health.services.ml.responseTime = Date.now() - startTime;
    health.services.ml.status = mlHealthResponse.data?.status === "healthy" ? "ok" : "unhealthy";
    health.services.ml.data = mlHealthResponse.data;
  } catch (error) {
    health.services.ml.status = "unreachable";
    health.services.ml.error = {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
    };
    health.success = false;
  }

  const statusCode = health.success ? 200 : 503;
  res.status(statusCode).json(health);
});

/*
=========================
ROUTES
=========================
*/
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chatbot", chatbotRoutes);

/*
=========================
ERROR HANDLERS LAST
=========================
*/
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || "127.0.0.1";

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`API server running at http://${HOST}:${PORT}`);
  });
}

module.exports = app;
