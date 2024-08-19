const userController = require("../../src/controllers/userController");
const dashboardService = require("../../src/services/dashboardService");
const { getRandomTips } = require("../../src/utils/sustainabilityTips");
const analyticsService = require("../../src/services/analyticsService");

// Mock the required modules
jest.mock("../../src/models", () => ({
  User: {
    findByPk: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
  },
  Notification: {
    findAll: jest.fn(),
    update: jest.fn(),
  },
  Order: {},
  Product: {},
  Sequelize: {
    Op: {
      lt: Symbol("lt"),
      gt: Symbol("gt"),
      eq: Symbol("eq"),
      ne: Symbol("ne"),
      // Add other operators as needed
    },
  },
}));

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
  getRandomTips: jest.fn(),
}));

describe("User Controller", () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      session: {
        getUserId: jest.fn().mockReturnValue("testUserId"),
      },
      body: {},
      params: {},
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getProfile", () => {
    it("should return user profile when user exists", async () => {
      const { User } = require("../../src/models");
      const mockUser = { id: "testUserId", name: "Test User" };
      User.findByPk.mockResolvedValue(mockUser);

      await userController.getProfile(mockReq, mockRes);

      expect(User.findByPk).toHaveBeenCalledWith("testUserId");
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it("should return 404 when user is not found", async () => {
      const { User } = require("../../src/models");
      User.findByPk.mockResolvedValue(null);

      await userController.getProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "User not found" });
    });
  });

  describe("updateProfile", () => {
    it("should update user profile successfully", async () => {
      const { User } = require("../../src/models");
      User.update.mockResolvedValue([1]);
      mockReq.body = { name: "Updated Name" };

      await userController.updateProfile(mockReq, mockRes);

      expect(User.update).toHaveBeenCalledWith(
        { name: "Updated Name" },
        { where: { id: "testUserId" } }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Profile updated successfully",
      });
    });

    it("should return 404 when user is not found during update", async () => {
      const { User } = require("../../src/models");
      User.update.mockResolvedValue([0]);

      await userController.updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "User not found" });
    });
  });

  describe("getDashboard", () => {
    it("should return dashboard data", async () => {
      const mockMetrics = { totalOrders: 10, sustainabilityScore: 85 };
      const mockTopProducts = [{ id: 1, name: "Eco Product" }];
      const mockRank = { rank: 5, percentile: 90 };
      const mockTips = ["Tip 1", "Tip 2"];

      dashboardService.calculateUserSustainabilityMetrics.mockResolvedValue(
        mockMetrics
      );
      dashboardService.getTopSustainableProducts.mockResolvedValue(
        mockTopProducts
      );
      dashboardService.getUserSustainabilityRank.mockResolvedValue(mockRank);
      getRandomTips.mockReturnValue(mockTips);

      await userController.getDashboard(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        metrics: mockMetrics,
        topProducts: mockTopProducts,
        rank: mockRank,
        tips: mockTips,
      });
    });

    it("should handle errors and return 500 status", async () => {
      dashboardService.calculateUserSustainabilityMetrics.mockRejectedValue(
        new Error("Database error")
      );

      await userController.getDashboard(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("updateFCMToken", () => {
    it("should update FCM token successfully", async () => {
      const { User } = require("../../src/models");
      User.update.mockResolvedValue([1]);
      mockReq.body = { fcmToken: "newFCMToken" };

      await userController.updateFCMToken(mockReq, mockRes);

      expect(User.update).toHaveBeenCalledWith(
        { fcmToken: "newFCMToken" },
        { where: { id: "testUserId" } }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "FCM token updated successfully",
      });
    });

    it("should handle errors and return 500 status", async () => {
      const { User } = require("../../src/models");
      User.update.mockRejectedValue(new Error("Database error"));

      await userController.updateFCMToken(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("getNotifications", () => {
    it("should return user notifications", async () => {
      const { Notification } = require("../../src/models");
      const mockNotifications = [
        { id: 1, message: "Notification 1" },
        { id: 2, message: "Notification 2" },
      ];
      Notification.findAll.mockResolvedValue(mockNotifications);

      await userController.getNotifications(mockReq, mockRes);

      expect(Notification.findAll).toHaveBeenCalledWith({
        where: { UserId: "testUserId" },
        order: [["createdAt", "DESC"]],
        limit: 50,
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockNotifications);
    });

    it("should handle errors and return 500 status", async () => {
      const { Notification } = require("../../src/models");
      Notification.findAll.mockRejectedValue(new Error("Database error"));

      await userController.getNotifications(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("markNotificationAsRead", () => {
    it("should mark a notification as read", async () => {
      const { Notification } = require("../../src/models");
      Notification.update.mockResolvedValue([1]);
      mockReq.params = { notificationId: "123" };

      await userController.markNotificationAsRead(mockReq, mockRes);

      expect(Notification.update).toHaveBeenCalledWith(
        { read: true },
        { where: { id: "123", UserId: "testUserId" } }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Notification marked as read",
      });
    });

    it("should return 404 when notification is not found", async () => {
      const { Notification } = require("../../src/models");
      Notification.update.mockResolvedValue([0]);
      mockReq.params = { notificationId: "999" };

      await userController.markNotificationAsRead(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Notification not found",
      });
    });

    it("should handle errors and return 500 status", async () => {
      const { Notification } = require("../../src/models");
      Notification.update.mockRejectedValue(new Error("Database error"));
      mockReq.params = { notificationId: "123" };

      await userController.markNotificationAsRead(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("getUserAnalytics", () => {
    it("should return user analytics", async () => {
      const mockAnalytics = { totalOrders: 20, totalSpent: 500 };
      analyticsService.getUserAnalytics.mockResolvedValue(mockAnalytics);

      await userController.getUserAnalytics(mockReq, mockRes);

      expect(analyticsService.getUserAnalytics).toHaveBeenCalledWith(
        "testUserId"
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockAnalytics);
    });

    it("should handle errors and return 500 status", async () => {
      analyticsService.getUserAnalytics.mockRejectedValue(
        new Error("Analytics error")
      );

      await userController.getUserAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("getComparativeAnalytics", () => {
    it("should return comparative analytics", async () => {
      const mockComparativeAnalytics = {
        userStats: { sustainabilityScore: 85 },
        platformAverages: { sustainabilityScore: 75 },
      };
      analyticsService.getComparativeAnalytics.mockResolvedValue(
        mockComparativeAnalytics
      );

      await userController.getComparativeAnalytics(mockReq, mockRes);

      expect(analyticsService.getComparativeAnalytics).toHaveBeenCalledWith(
        "testUserId"
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockComparativeAnalytics);
    });

    it("should handle errors and return 500 status", async () => {
      analyticsService.getComparativeAnalytics.mockRejectedValue(
        new Error("Analytics error")
      );

      await userController.getComparativeAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

});
