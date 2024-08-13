const { SustainabilityGoal, User } = require("../models");
const notificationService = require("../services/notificationService");
const gamificationService = require("../services/gamificationService");

exports.createGoal = async (req, res) => {
  try {
    const userId = req.session.getUserId();
    const goal = await SustainabilityGoal.create({
      ...req.body,
      UserId: userId,
    });

    await notificationService.sendNotification(
      userId,
      `New sustainability goal created: ${goal.title}`,
      "goal_created"
    );

    res.status(201).json(goal);
  } catch (error) {
    console.error("Error creating sustainability goal:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getUserGoals = async (req, res) => {
  try {
    const userId = req.session.getUserId();
    const goals = await SustainabilityGoal.findAll({
      where: { UserId: userId },
      order: [["createdAt", "DESC"]],
    });
    res.json(goals);
  } catch (error) {
    console.error("Error fetching user goals:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const userId = req.session.getUserId();
    const { id } = req.params;
    const { currentValue } = req.body;

    const goal = await SustainabilityGoal.findOne({
      where: { id, UserId: userId },
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    const previousStatus = goal.status;
    goal.currentValue = currentValue;

    if (currentValue >= goal.targetValue && goal.status !== "completed") {
      goal.status = "completed";
      await notificationService.sendNotification(
        userId,
        `Congratulations! You've achieved your goal: ${goal.title}`,
        "goal_completed"
      );
      await gamificationService.awardPoints(
        userId,
        50,
        "completing a sustainability goal"
      );
    } else if (
      goal.deadline &&
      new Date() > goal.deadline &&
      goal.status === "in_progress"
    ) {
      goal.status = "failed";
      await notificationService.sendNotification(
        userId,
        `Your goal "${goal.title}" has expired. Don't give up, try again!`,
        "goal_expired"
      );
    }

    await goal.save();

    if (previousStatus !== "completed" && goal.status === "completed") {
      await gamificationService.checkAchievements(userId);
    }

    res.json(goal);
  } catch (error) {
    console.error("Error updating sustainability goal:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const userId = req.session.getUserId();
    const { id } = req.params;

    const deletedRows = await SustainabilityGoal.destroy({
      where: { id, UserId: userId },
    });

    if (deletedRows === 0) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("Error deleting sustainability goal:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
