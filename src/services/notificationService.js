const {
  User,
  Subscription,
  SubscriptionBox,
  Notification,
} = require("../models");
const { Op } = require("sequelize");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Initialize Firebase only once
if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        : undefined,
    }),
  });
}

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendNotification = async (userId, message, type = "info") => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Save notification to database
    const notification = await Notification.create({
      UserId: userId,
      message,
      type,
    });

    // Send push notification if FCM token is available
    if (user.fcmToken) {
      await admin.messaging().send({
        token: user.fcmToken,
        notification: {
          title: "Ecolaura Notification",
          body: message,
        },
      });
    }

    // Send email notification
    await transporter.sendMail({
      from: '"Ecolaura" <noreply@ecolaura.com>',
      to: user.email,
      subject: "Ecolaura Notification",
      text: message,
      html: `<p>${message}</p>`,
    });

    console.log(`Notification sent to user ${userId}: ${message}`);
    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
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
      `Your ${subscription.SubscriptionBox.name} is scheduled for delivery tomorrow!`,
      "delivery"
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
