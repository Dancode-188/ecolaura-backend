const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { requireAuth } = require("../middlewares/authMiddleware");

router.get("/profile", requireAuth, userController.getProfile);
router.put("/profile", requireAuth, userController.updateProfile);
router.get("/dashboard", requireAuth, userController.getDashboard);
router.post("/fcm-token", requireAuth, userController.updateFCMToken);
router.get("/notifications", requireAuth, userController.getNotifications);
router.patch(
  "/notifications/:notificationId/read",
  requireAuth,
  userController.markNotificationAsRead
);
router.get("/analytics", requireAuth, userController.getUserAnalytics);
router.get(
  "/comparative-analytics",
  requireAuth,
  userController.getComparativeAnalytics
);
router.get(
  "/personalized-tips",
  requireAuth,
  userController.getPersonalizedTips
);

module.exports = router;
