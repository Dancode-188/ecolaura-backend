const {
  verifySession,
} = require("supertokens-node/recipe/session/framework/express");
const { User, Admin } = require("../models");
const jwt = require("jsonwebtoken");

const requireAuth = verifySession();

exports.requireAdminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findByPk(decoded.id);
    if (!admin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = { requireAuth };
