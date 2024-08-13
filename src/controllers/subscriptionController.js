const { Subscription, SubscriptionBox, User } = require("../models");
const notificationService = require("../services/notificationService");

exports.subscribeUser = async (req, res) => {
  try {
    const { subscriptionBoxId } = req.body;
    const userId = req.session.getUserId();

    const subscriptionBox = await SubscriptionBox.findByPk(subscriptionBoxId);
    if (!subscriptionBox) {
      return res.status(404).json({ message: "Subscription box not found" });
    }

    const nextDeliveryDate = calculateNextDeliveryDate(
      subscriptionBox.frequency
    );

    const subscription = await Subscription.create({
      UserId: userId,
      SubscriptionBoxId: subscriptionBoxId,
      nextDeliveryDate,
    });

    // Send a notification to the user
    await notificationService.sendNotification(
      userId,
      `You've successfully subscribed to ${
        subscriptionBox.name
      }! Your first delivery is scheduled for ${nextDeliveryDate.toDateString()}.`
    );

    res.status(201).json(subscription);
  } catch (error) {
    console.error("Error subscribing user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.session.getUserId();
    const subscriptions = await Subscription.findAll({
      where: { UserId: userId },
      include: [{ model: SubscriptionBox, include: [Product] }],
    });
    res.json(subscriptions);
  } catch (error) {
    console.error("Error fetching user subscriptions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateSubscriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.session.getUserId();

    const [updatedRows] = await Subscription.update(
      { status },
      { where: { id, UserId: userId } }
    );

    if (updatedRows === 0) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.json({ message: "Subscription updated successfully" });
  } catch (error) {
    console.error("Error updating subscription status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

function calculateNextDeliveryDate(frequency) {
  const now = new Date();
  switch (frequency) {
    case "weekly":
      return new Date(now.setDate(now.getDate() + 7));
    case "biweekly":
      return new Date(now.setDate(now.getDate() + 14));
    case "monthly":
      return new Date(now.setMonth(now.getMonth() + 1));
    default:
      throw new Error("Invalid frequency");
  }
}
