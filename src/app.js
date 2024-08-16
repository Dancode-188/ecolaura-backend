const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const supertokens = require("./config/supertokens");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const sustainabilityPostRoutes = require("./routes/sustainabilityPostRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const gamificationRoutes = require("./routes/gamificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const sustainabilityGoalRoutes = require("./routes/sustainabilityGoalRoutes");
const tradeInRoutes = require("./routes/tradeInRoutes");

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.WEBSITE_DOMAIN,
    allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// SuperTokens middleware
app.use(supertokens.middleware);

// Routes
if (authRoutes && typeof authRoutes === "function")
  app.use("/api/auth", authRoutes);
if (userRoutes && typeof userRoutes === "function")
  app.use("/api/users", userRoutes);
if (productRoutes && typeof productRoutes === "function")
  app.use("/api/products", productRoutes);
if (orderRoutes && typeof orderRoutes === "function")
  app.use("/api/orders", orderRoutes);
if (subscriptionRoutes && typeof subscriptionRoutes === "function")
  app.use("/api/subscriptions", subscriptionRoutes);
if (sustainabilityPostRoutes && typeof sustainabilityPostRoutes === "function")
  app.use("/api/community", sustainabilityPostRoutes);
if (reviewRoutes && typeof reviewRoutes === "function")
  app.use("/api/reviews", reviewRoutes);
if (gamificationRoutes && typeof gamificationRoutes === "function")
  app.use("/api/gamification", gamificationRoutes);
if (adminRoutes && typeof adminRoutes === "function")
  app.use("/api/admin", adminRoutes);
if (sustainabilityGoalRoutes && typeof sustainabilityGoalRoutes === "function")
  app.use("/api/sustainability-goals", sustainabilityGoalRoutes);
if (tradeInRoutes && typeof tradeInRoutes === "function")
  app.use("/api/trade-in", tradeInRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Ecolaura API" });
});

// SuperTokens error handler
app.use(supertokens.errorHandler);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

module.exports = app;
