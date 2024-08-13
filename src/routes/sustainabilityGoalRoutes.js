const express = require("express");
const router = express.Router();
const sustainabilityGoalController = require("../controllers/sustainabilityGoalController");
const { requireAuth } = require("../middlewares/authMiddleware");

router.post("/", requireAuth, sustainabilityGoalController.createGoal);
router.get("/", requireAuth, sustainabilityGoalController.getUserGoals);
router.put("/:id", requireAuth, sustainabilityGoalController.updateGoal);
router.delete("/:id", requireAuth, sustainabilityGoalController.deleteGoal);

module.exports = router;
