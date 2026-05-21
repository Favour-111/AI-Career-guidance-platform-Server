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

app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    req.headers.origin || "*",
  );

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );

  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );

  res.header(
    "Access-Control-Allow-Credentials",
    "true",
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

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

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Running on ${PORT}`);
});

module.exports = app;