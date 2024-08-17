const request = require("supertest");
const express = require("express");
const { SustainabilityGoal, User } = require("../../src/models");
const notificationService = require("../../src/services/notificationService");
const gamificationService = require("../../src/services/gamificationService");

// Mocks
jest.mock("../../src/models", () => ({
  SustainabilityGoal: {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
  },
  User: {},
}));
jest.mock("../../src/services/notificationService", () => ({
  sendNotification: jest.fn(),
}));

jest.mock("../../src/services/gamificationService", () => ({
  awardPoints: jest.fn(),
  checkAchievements: jest.fn(),
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
const sustainabilityGoalRoutes = require("../../src/routes/sustainabilityGoalRoutes");

app.use(express.json());
app.use("/sustainability-goals", sustainabilityGoalRoutes);

describe("Sustainability Goal Routes", () => {
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

  describe("POST /sustainability-goals", () => {
    it("should create a new sustainability goal", async () => {
      const mockGoal = {
        id: 1,
        title: "Reduce plastic usage",
        UserId: "mockUserId",
      };
      SustainabilityGoal.create.mockResolvedValue(mockGoal);

      const res = await request(app)
        .post("/sustainability-goals")
        .send({ title: "Reduce plastic usage", targetValue: 10 });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(mockGoal);
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });

    it("should handle errors when creating a goal", async () => {
      SustainabilityGoal.create.mockRejectedValue(new Error("Database error"));

      const res = await request(app)
        .post("/sustainability-goals")
        .send({ title: "Reduce plastic usage", targetValue: 10 });

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });

  describe("GET /sustainability-goals", () => {
    it("should return user goals", async () => {
      const mockGoals = [
        { id: 1, title: "Reduce plastic usage" },
        { id: 2, title: "Save energy" },
      ];
      SustainabilityGoal.findAll.mockResolvedValue(mockGoals);

      const res = await request(app).get("/sustainability-goals");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockGoals);
    });

    it("should handle errors when fetching goals", async () => {
      SustainabilityGoal.findAll.mockRejectedValue(new Error("Database error"));

      const res = await request(app).get("/sustainability-goals");

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });

  describe("PUT /sustainability-goals/:id", () => {
    it("should update a goal", async () => {
      const mockGoal = {
        id: 1,
        title: "Reduce plastic usage",
        targetValue: 10,
        currentValue: 5,
        status: "in_progress",
        deadline: new Date(Date.now() + 86400000), // 1 day from now
        save: jest.fn(),
        get: jest.fn().mockReturnThis(),
      };
      SustainabilityGoal.findOne.mockResolvedValue(mockGoal);

      const res = await request(app)
        .put("/sustainability-goals/1")
        .send({ currentValue: 8 });

      if (res.statusCode !== 200) {
        console.error("Unexpected response:", res.body);
      }

      expect(res.statusCode).toBe(200);
      const { save, get, ...goalWithoutMethods } = mockGoal;
      expect(res.body).toEqual({
        ...goalWithoutMethods,
        currentValue: 8,
        deadline: mockGoal.deadline.toISOString(),
      });
      expect(mockGoal.save).toHaveBeenCalled();
    });

    it("should handle goal completion", async () => {
      const mockGoal = {
        id: 1,
        title: "Reduce plastic usage",
        targetValue: 10,
        currentValue: 9,
        status: "in_progress",
        deadline: new Date(Date.now() + 86400000),
        save: jest.fn(),
        get: jest.fn(function () {
          return { ...this, save: undefined, get: undefined };
        }),
      };
      SustainabilityGoal.findOne.mockResolvedValue(mockGoal);
      notificationService.sendNotification.mockResolvedValue();
      gamificationService.awardPoints.mockResolvedValue();
      gamificationService.checkAchievements.mockResolvedValue();

      const res = await request(app)
        .put("/sustainability-goals/1")
        .send({ currentValue: 10 });

      if (res.statusCode !== 200) {
        console.error("Unexpected response:", res.body);
      }

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("completed");
      expect(notificationService.sendNotification).toHaveBeenCalled();
      expect(gamificationService.awardPoints).toHaveBeenCalled();
      expect(mockGoal.save).toHaveBeenCalled();
    });

    it("should handle goal not found", async () => {
      SustainabilityGoal.findOne.mockResolvedValue(null);

      const res = await request(app)
        .put("/sustainability-goals/999")
        .send({ currentValue: 5 });

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: "Goal not found" });
    });
  });

  describe("DELETE /sustainability-goals/:id", () => {
    it("should delete a goal", async () => {
      SustainabilityGoal.destroy.mockResolvedValue(1);

      const res = await request(app).delete("/sustainability-goals/1");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: "Goal deleted successfully" });
    });

    it("should handle goal not found", async () => {
      SustainabilityGoal.destroy.mockResolvedValue(0);

      const res = await request(app).delete("/sustainability-goals/999");

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: "Goal not found" });
    });
  });
});
