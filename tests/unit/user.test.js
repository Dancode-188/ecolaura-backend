const userController = require("../../src/controllers/userController");

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

});
