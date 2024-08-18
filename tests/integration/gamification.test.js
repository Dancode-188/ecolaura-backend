const request = require("supertest");
const express = require("express");
const { User, Achievement } = require("../../src/models");

// Mocks
jest.mock("../../src/models", () => ({
  User: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
  },
  Achievement: {
    findAll: jest.fn(),
  },
}));

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
const gamificationRoutes = require("../../src/routes/gamificationRoutes");

app.use(express.json());
app.use("/gamification", gamificationRoutes);

describe("Gamification Routes", () => {
    const originalConsoleError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalConsoleError;
    });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /gamification/stats", () => {
    it("should return user stats", async () => {
      const mockUser = {
        id: "mockUserId",
        name: "Test User",
        sustainabilityPoints: 100,
        level: 2,
        achievements: [1, 2],
        toJSON: jest.fn().mockReturnThis(),
      };
      const mockAchievements = [
        { id: 1, name: "First Goal" },
        { id: 2, name: "Level Up" },
      ];

      User.findByPk.mockResolvedValue(mockUser);
      Achievement.findAll.mockResolvedValue(mockAchievements);

      const res = await request(app).get("/gamification/stats");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        sustainabilityPoints: mockUser.sustainabilityPoints,
        level: mockUser.level,
        achievements: mockAchievements,
      });
    });

    it("should handle user not found", async () => {
      User.findByPk.mockResolvedValue(null);

      const res = await request(app).get("/gamification/stats");

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: "User not found" });
    });

    it("should handle errors when fetching user stats", async () => {
      User.findByPk.mockRejectedValue(new Error("Database error"));

      const res = await request(app).get("/gamification/stats");

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });

  describe("GET /gamification/leaderboard", () => {
    it("should return leaderboard", async () => {
      const mockLeaderboard = [
        { id: 1, name: "User 1", sustainabilityPoints: 150, level: 3 },
        { id: 2, name: "User 2", sustainabilityPoints: 120, level: 2 },
      ];

      User.findAll.mockResolvedValue(mockLeaderboard);

      const res = await request(app).get("/gamification/leaderboard");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockLeaderboard);
    });

    it("should handle errors when fetching leaderboard", async () => {
      User.findAll.mockRejectedValue(new Error("Database error"));

      const res = await request(app).get("/gamification/leaderboard");

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });
});
