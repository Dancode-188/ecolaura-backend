const express = require("express");
const router = express.Router();
const gamificationController = require("../controllers/gamificationController");
const { requireAuth } = require("../middlewares/authMiddleware");

router.get("/stats", requireAuth, gamificationController.getUserStats);
router.get("/leaderboard", gamificationController.getLeaderboard);

module.exports = router;
