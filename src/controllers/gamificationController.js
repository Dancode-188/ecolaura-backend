const { User, Achievement } = require("../models");

exports.getUserStats = async (req, res) => {
  try {
    const userId = req.session.getUserId();
    const user = await User.findByPk(userId, {
      attributes: [
        "id",
        "name",
        "sustainabilityPoints",
        "level",
        "achievements",
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const achievements = await Achievement.findAll({
      where: {
        id: user.achievements,
      },
    });

    res.json({
      ...user.toJSON(),
      achievements: achievements,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.findAll({
      attributes: ["id", "name", "sustainabilityPoints", "level"],
      order: [
        ["sustainabilityPoints", "DESC"],
        ["level", "DESC"],
      ],
      limit: 10,
    });

    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
