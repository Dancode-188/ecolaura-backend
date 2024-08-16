const {
  verifySession,
} = require("supertokens-node/recipe/session/framework/express");
const { User, Admin } = require("../models");

// Basic auth middleware for all authenticated users
const requireAuth = verifySession();

// Admin auth middleware
const requireAdminAuth = verifySession(async (req, res, next) => {
  try {
    const userId = req.session.getUserId();
    const admin = await Admin.findOne({ where: { userId: userId } });

    if (!admin) {
      return res
        .status(403)
        .json({ message: "Access denied. Admin rights required." });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin authentication error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
});

module.exports = { requireAuth, requireAdminAuth };
