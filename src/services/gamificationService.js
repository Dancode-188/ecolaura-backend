const { User, Achievement } = require("../models");
const notificationService = require("./notificationService");

const POINTS_PER_LEVEL = 100;

exports.awardPoints = async (userId, points, reason) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.sustainabilityPoints += points;

  // Check for level up
  const newLevel = Math.floor(user.sustainabilityPoints / POINTS_PER_LEVEL) + 1;
  if (newLevel > user.level) {
    user.level = newLevel;
    await notificationService.sendNotification(
      userId,
      `Congratulations! You've reached level ${newLevel}!`,
      "level_up"
    );
  }

  await user.save();

  await notificationService.sendNotification(
    userId,
    `You've earned ${points} sustainability points for ${reason}!`,
    "points_earned"
  );

  return user;
};

exports.checkAchievements = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const allAchievements = await Achievement.findAll();
  const newAchievements = [];

  for (const achievement of allAchievements) {
    if (!user.achievements.includes(achievement.id)) {
      if (await this.hasMetAchievementCriteria(user, achievement)) {
        user.achievements.push(achievement.id);
        user.sustainabilityPoints += achievement.pointValue;
        newAchievements.push(achievement);

        await notificationService.sendNotification(
          userId,
          `You've earned the "${achievement.name}" achievement and ${achievement.pointValue} points!`,
          "achievement_earned"
        );
      }
    }
  }

  if (newAchievements.length > 0) {
    await user.save();
  }

  return newAchievements;
};

exports.hasMetAchievementCriteria = async (user, achievement) => {
  // Implement the logic for checking if a user has met the criteria for an achievement
  // This will vary based on the specific achievements you want to implement
  // For example:
  switch (achievement.name) {
    case "First Purchase":
      return (await user.countOrders()) > 0;
    case "Eco Warrior":
      return user.sustainabilityPoints >= 1000;
    case "Review Master":
      return (await user.countReviews()) >= 10;
    // Add more cases for other achievements
    default:
      return false;
  }
};
