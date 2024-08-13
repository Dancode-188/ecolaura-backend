const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const supertokens = require("./config/supertokens");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

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
app.use(supertokens.middleware());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Ecolaura API" });
});

// SuperTokens error handler
app.use(supertokens.errorHandler());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

module.exports = app;
