const { User, Subscription, SubscriptionBox } = require("../models");
const { Op } = require("sequelize");

exports.sendNotification = async (userId, message) => {
  // In a real-world scenario, this would integrate with a push notification service,
  // email service, or SMS gateway. For now, we'll just console.log the notification.
  console.log(`Notification for user ${userId}: ${message}`);

  // Here, you might also save the notification to a database for the user to view later
};

exports.checkUpcomingDeliveries = async () => {
  const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1));
  const subscriptions = await Subscription.findAll({
    where: {
      status: "active",
      nextDeliveryDate: {
        [Op.lt]: tomorrow,
      },
    },
    include: [{ model: User }, { model: SubscriptionBox }],
  });

  for (const subscription of subscriptions) {
    await this.sendNotification(
      subscription.User.id,
      `Your ${subscription.SubscriptionBox.name} is scheduled for delivery tomorrow!`
    );

    // Update the next delivery date
    const nextDeliveryDate = calculateNextDeliveryDate(
      subscription.SubscriptionBox.frequency
    );
    await subscription.update({ nextDeliveryDate });
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
