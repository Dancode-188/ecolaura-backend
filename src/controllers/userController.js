const { User } = require("../models");
const dashboardService = require("../services/dashboardService");
const { getRandomTips } = require("../utils/sustainabilityTips");
const { Notification } = require("../models");
const analyticsService = require("../services/analyticsService");

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.session.getUserId());
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const [updatedRows] = await User.update(req.body, {
      where: { id: req.session.getUserId() },
    });
    if (updatedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.session.getUserId();
    const metrics = await dashboardService.calculateUserSustainabilityMetrics(
      userId
    );
    const topProducts = await dashboardService.getTopSustainableProducts();
    const rank = await dashboardService.getUserSustainabilityRank(userId);

    res.json({
      metrics,
      topProducts,
      rank,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.session.getUserId();
    const metrics = await dashboardService.calculateUserSustainabilityMetrics(
      userId
    );
    const topProducts = await dashboardService.getTopSustainableProducts();
    const rank = await dashboardService.getUserSustainabilityRank(userId);
    const tips = getRandomTips();

    res.json({
      metrics,
      topProducts,
      rank,
      tips,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateFCMToken = async (req, res) => {
  try {
    const userId = req.session.getUserId();
    const { fcmToken } = req.body;

    await User.update({ fcmToken }, { where: { id: userId } });

    res.json({ message: "FCM token updated successfully" });
  } catch (error) {
    console.error("Error updating FCM token:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.session.getUserId();
    const notifications = await Notification.findAll({
      where: { UserId: userId },
      order: [["createdAt", "DESC"]],
      limit: 50,
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.session.getUserId();
    const { notificationId } = req.params;

    const [updatedRows] = await Notification.update(
      { read: true },
      { where: { id: notificationId, UserId: userId } }
    );

    if (updatedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getUserAnalytics = async (req, res) => {
  try {
    const userId = req.session.getUserId();
    const analytics = await analyticsService.getUserAnalytics(userId);
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};