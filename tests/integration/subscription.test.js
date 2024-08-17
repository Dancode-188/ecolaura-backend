const request = require("supertest");
const express = require("express");
const {
  Subscription,
  SubscriptionBox,
  User,
  Product,
} = require("../../src/models");
const notificationService = require("../../src/services/notificationService");

// Mocks
jest.mock("../../src/models", () => ({
  Subscription: {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
  SubscriptionBox: {
    findByPk: jest.fn(),
  },
  User: {},
  Product: {},
}));
jest.mock("../../src/services/notificationService");

// Mock session
const mockSession = {
  getUserId: jest.fn().mockReturnValue("mockUserId"),
};

// Mock auth middleware
jest.mock("../../src/middlewares/authMiddleware", () => ({
  requireAuth: (req, res, next) => {
    req.session = mockSession;
    next();
  },
}));

const app = express();
const subscriptionRoutes = require("../../src/routes/subscriptionRoutes");

app.use(express.json());
app.use("/subscriptions", subscriptionRoutes);

describe("Subscription Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /subscriptions/subscribe", () => {
    it("should create a new subscription", async () => {
      const mockSubscriptionBox = {
        id: 1,
        name: "Eco Box",
        frequency: "monthly",
      };
      const mockSubscription = {
        id: 1,
        UserId: "mockUserId",
        SubscriptionBoxId: 1,
      };

      SubscriptionBox.findByPk.mockResolvedValue(mockSubscriptionBox);
      Subscription.create.mockResolvedValue(mockSubscription);

      const res = await request(app)
        .post("/subscriptions/subscribe")
        .send({ subscriptionBoxId: 1 });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(mockSubscription);
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });

    it("should handle subscription box not found", async () => {
      SubscriptionBox.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .post("/subscriptions/subscribe")
        .send({ subscriptionBoxId: 999 });

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: "Subscription box not found" });
    });

    it("should handle errors when creating a subscription", async () => {
      SubscriptionBox.findByPk.mockResolvedValue({
        id: 1,
        name: "Eco Box",
        frequency: "monthly",
      });
      Subscription.create.mockRejectedValue(new Error("Database error"));

      const res = await request(app)
        .post("/subscriptions/subscribe")
        .send({ subscriptionBoxId: 1 });

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });

  describe("GET /subscriptions/user", () => {
    it("should return user subscriptions", async () => {
      const mockSubscriptions = [
        { id: 1, SubscriptionBox: { name: "Eco Box", Products: [] } },
        { id: 2, SubscriptionBox: { name: "Green Box", Products: [] } },
      ];
      Subscription.findAll.mockResolvedValue(mockSubscriptions);

      const res = await request(app).get("/subscriptions/user");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockSubscriptions);
    });

    it("should handle errors when fetching user subscriptions", async () => {
      Subscription.findAll.mockRejectedValue(new Error("Database error"));

      const res = await request(app).get("/subscriptions/user");

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });

  describe("PATCH /subscriptions/:id/status", () => {
    it("should update subscription status", async () => {
      Subscription.update.mockResolvedValue([1]);

      const res = await request(app)
        .patch("/subscriptions/1/status")
        .send({ status: "paused" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        message: "Subscription updated successfully",
      });
    });

    it("should handle subscription not found", async () => {
      Subscription.update.mockResolvedValue([0]);

      const res = await request(app)
        .patch("/subscriptions/999/status")
        .send({ status: "paused" });

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: "Subscription not found" });
    });

    it("should handle errors when updating subscription status", async () => {
      Subscription.update.mockRejectedValue(new Error("Database error"));

      const res = await request(app)
        .patch("/subscriptions/1/status")
        .send({ status: "paused" });

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });
});
