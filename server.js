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

// Route imports
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const marketRoutes = require("./routes/marketRoutes");
const adminRoutes = require("./routes/adminRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");

// Connect DB
connectDB();

const app = express();

/*
|--------------------------------------------------------------------------
| SECURITY
|--------------------------------------------------------------------------
*/

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

/*
|--------------------------------------------------------------------------
| CORS (ALLOW ANY ORIGIN)
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: true, // automatically reflects requesting origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Origin",
      "Accept",
    ],
  }),
);

// Handle browser preflight requests
app.options("*", cors());

/*
|--------------------------------------------------------------------------
| BODY PARSER
|--------------------------------------------------------------------------
*/

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

/*
|--------------------------------------------------------------------------
| SANITIZE REQUESTS
|--------------------------------------------------------------------------
*/

app.use(mongoSanitize());

/*
|--------------------------------------------------------------------------
| LOGGER
|--------------------------------------------------------------------------
*/

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/*
|--------------------------------------------------------------------------
| RATE LIMITER
|--------------------------------------------------------------------------
*/

app.use(globalLimiter);

/*
|--------------------------------------------------------------------------
| STATIC FILES
|--------------------------------------------------------------------------
*/

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads")),
);

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    message: "AI Career Guidance API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| ROUTES
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);

app.use("/api/profile", profileRoutes);

app.use("/api/recommendations", recommendationRoutes);

app.use("/api/market", marketRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/chatbot", chatbotRoutes);


app.use(notFound);


app.use(errorHandler);


const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`
🚀 Server running in ${process.env.NODE_ENV} mode
📡 API: http://localhost:${PORT}/api
🏥 Health: http://localhost:${PORT}/api/health
`);
});

module.exports = app;