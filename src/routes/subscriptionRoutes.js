const express = require("express");
const router = express.Router();
const subscriptionBoxController = require("../controllers/subscriptionBoxController");
const subscriptionController = require("../controllers/subscriptionController");
const { requireAuth } = require("../middlewares/authMiddleware");

// Subscription Box routes
router.get("/boxes", subscriptionBoxController.getAllSubscriptionBoxes);
router.get("/boxes/:id", subscriptionBoxController.getSubscriptionBoxById);
router.post(
  "/boxes",
  requireAuth,
  subscriptionBoxController.createSubscriptionBox
);

// User Subscription routes
router.post("/subscribe", requireAuth, subscriptionController.subscribeUser);
router.get("/user", requireAuth, subscriptionController.getUserSubscriptions);
router.patch(
  "/:id/status",
  requireAuth,
  subscriptionController.updateSubscriptionStatus
);

module.exports = router;
