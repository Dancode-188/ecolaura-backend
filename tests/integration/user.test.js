const request = require("supertest");
const express = require("express");

const mockOp = {
  gte: Symbol("gte"),
  lte: Symbol("lte"),
  // Add other operators as needed
};

jest.mock("sequelize", () => ({
  Op: mockOp,
}));

jest.mock("../../src/models", () => {
  const mockSequelize = { Op: mockOp };
  return {
    User: {
      findByPk: jest.fn(),
      update: jest.fn(),
    },
    Notification: {
      findAll: jest.fn(),
      update: jest.fn(),
    },
    Order: {},
    Product: {},
    Sequelize: mockSequelize,
  };
});

jest.mock("../../src/services/dashboardService", () => ({
  calculateUserSustainabilityMetrics: jest.fn(),
  getTopSustainableProducts: jest.fn(),
  getUserSustainabilityRank: jest.fn(),
}));

jest.mock("../../src/services/analyticsService", () => ({
  getUserAnalytics: jest.fn(),
  getComparativeAnalytics: jest.fn(),
}));

jest.mock("../../src/services/sustainabilityTipsService", () => ({
  getPersonalizedTips: jest.fn(),
}));

jest.mock("../../src/utils/sustainabilityTips", () => ({
  getRandomTips: jest.fn().mockReturnValue(["Tip 1", "Tip 2", "Tip 3"]),
}));

const { User, Notification } = require("../../src/models");
const dashboardService = require("../../src/services/dashboardService");
const analyticsService = require("../../src/services/analyticsService");
const sustainabilityTipsService = require("../../src/services/sustainabilityTipsService");

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
const userRoutes = require("../../src/routes/userRoutes");

app.use(express.json());
app.use("/users", userRoutes);


describe("User Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /users/profile", () => {
    it("should return user profile", async () => {
      const mockUser = {
        id: "mockUserId",
        name: "Test User",
        email: "test@example.com",
      };
      User.findByPk.mockResolvedValue(mockUser);

      const res = await request(app).get("/users/profile");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockUser);
    });

    it("should handle user not found", async () => {
      User.findByPk.mockResolvedValue(null);

      const res = await request(app).get("/users/profile");

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: "User not found" });
    });
  });

  describe("PUT /users/profile", () => {
    it("should update user profile", async () => {
      User.update.mockResolvedValue([1]);

      const res = await request(app)
        .put("/users/profile")
        .send({ name: "Updated Name" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: "Profile updated successfully" });
    });

    it("should handle user not found during update", async () => {
      User.update.mockResolvedValue([0]);

      const res = await request(app)
        .put("/users/profile")
        .send({ name: "Updated Name" });

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: "User not found" });
    });
  });

  describe("GET /users/dashboard", () => {
    it("should return dashboard data", async () => {
      const mockDashboardData = {
        metrics: { totalOrders: 10, sustainabilityScore: 85 },
        topProducts: [{ id: 1, name: "Eco Product" }],
        rank: { rank: 5, percentile: 90 },
      };
      dashboardService.calculateUserSustainabilityMetrics.mockResolvedValue(
        mockDashboardData.metrics
      );
      dashboardService.getTopSustainableProducts.mockResolvedValue(
        mockDashboardData.topProducts
      );
      dashboardService.getUserSustainabilityRank.mockResolvedValue(
        mockDashboardData.rank
      );

      const res = await request(app).get("/users/dashboard");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        ...mockDashboardData,
        tips: expect.any(Array),
      });
    });
  });

  describe("POST /users/fcm-token", () => {
    it("should update FCM token", async () => {
      User.update.mockResolvedValue([1]);

      const res = await request(app)
        .post("/users/fcm-token")
        .send({ fcmToken: "new-fcm-token" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: "FCM token updated successfully" });
    });
  });

  describe("GET /users/notifications", () => {
    it("should return user notifications", async () => {
      const mockNotifications = [
        { id: 1, message: "Notification 1", read: false },
        { id: 2, message: "Notification 2", read: true },
      ];
      Notification.findAll.mockResolvedValue(mockNotifications);

      const res = await request(app).get("/users/notifications");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockNotifications);
    });
  });

  describe("PATCH /users/notifications/:notificationId/read", () => {
    it("should mark notification as read", async () => {
      Notification.update.mockResolvedValue([1]);

      const res = await request(app).patch("/users/notifications/1/read");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: "Notification marked as read" });
    });

    it("should handle notification not found", async () => {
      Notification.update.mockResolvedValue([0]);

      const res = await request(app).patch("/users/notifications/999/read");

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: "Notification not found" });
    });
  });

  describe("GET /users/analytics", () => {
    it("should return user analytics", async () => {
      const mockAnalytics = {
        totalOrders: 20,
        totalSpent: 500,
        sustainabilityImpact: { carbonSaved: 100, waterSaved: 1000 },
      };
      analyticsService.getUserAnalytics.mockResolvedValue(mockAnalytics);

      const res = await request(app).get("/users/analytics");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockAnalytics);
    });
  });

  describe("GET /users/comparative-analytics", () => {
    it("should return comparative analytics", async () => {
      const mockComparativeAnalytics = {
        userStats: { sustainabilityScore: 85 },
        platformAverages: { sustainabilityScore: 75 },
        userRank: { percentile: 90 },
      };
      analyticsService.getComparativeAnalytics.mockResolvedValue(
        mockComparativeAnalytics
      );

      const res = await request(app).get("/users/comparative-analytics");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockComparativeAnalytics);
    });
  });

  describe("GET /users/personalized-tips", () => {
    it("should return personalized sustainability tips", async () => {
      const mockTips = ["Tip 1", "Tip 2", "Tip 3"];
      sustainabilityTipsService.getPersonalizedTips.mockResolvedValue(mockTips);

      const res = await request(app).get("/users/personalized-tips");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockTips);
    });
  });
});
