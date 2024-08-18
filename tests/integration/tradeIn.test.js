const request = require("supertest");
const express = require("express");
const { TradeIn, User } = require("../../src/models");
const notificationService = require("../../src/services/notificationService");
const gamificationService = require("../../src/services/gamificationService");

// Mocks
jest.mock("../../src/models", () => ({
  TradeIn: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
  },
  User: {},
}));
jest.mock("../../src/services/notificationService");
jest.mock("../../src/services/gamificationService");

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
const tradeInRoutes = require("../../src/routes/tradeInRoutes");

app.use(express.json());
app.use("/trade-in", tradeInRoutes);

describe("Trade-In Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /trade-in", () => {
    it("should create a new trade-in request", async () => {
      const mockTradeIn = {
        id: 1,
        UserId: "mockUserId",
        productName: "Old Phone",
        condition: "Good",
        description: "Minor scratches",
      };
      TradeIn.create.mockResolvedValue(mockTradeIn);

      const res = await request(app).post("/trade-in").send({
        productName: "Old Phone",
        condition: "Good",
        description: "Minor scratches",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(mockTradeIn);
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });

    it("should handle errors when creating a trade-in request", async () => {
      TradeIn.create.mockRejectedValue(new Error("Database error"));

      const res = await request(app).post("/trade-in").send({
        productName: "Old Phone",
        condition: "Good",
        description: "Minor scratches",
      });

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });

  describe("GET /trade-in/user", () => {
    it("should return user trade-ins", async () => {
      const mockTradeIns = [
        { id: 1, productName: "Old Phone" },
        { id: 2, productName: "Old Laptop" },
      ];
      TradeIn.findAll.mockResolvedValue(mockTradeIns);

      const res = await request(app).get("/trade-in/user");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockTradeIns);
    });

    it("should handle errors when fetching user trade-ins", async () => {
      TradeIn.findAll.mockRejectedValue(new Error("Database error"));

      const res = await request(app).get("/trade-in/user");

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });

  describe("PUT /trade-in/:id/status", () => {
    it("should update trade-in status to approved", async () => {
      const mockTradeIn = {
        id: 1,
        productName: "Old Phone",
        User: { id: "userId" },
        update: jest.fn(),
      };
      TradeIn.findByPk.mockResolvedValue(mockTradeIn);

      const res = await request(app)
        .put("/trade-in/1/status")
        .send({ status: "approved", estimatedValue: 100 });

      expect(res.statusCode).toBe(200);
      expect(mockTradeIn.update).toHaveBeenCalledWith({
        status: "approved",
        estimatedValue: 100,
      });
      expect(notificationService.sendNotification).toHaveBeenCalled();
      expect(gamificationService.awardPoints).toHaveBeenCalled();
    });

    it("should update trade-in status to completed", async () => {
      const mockTradeIn = {
        id: 1,
        productName: "Old Phone",
        User: { id: "userId" },
        update: jest.fn(),
      };
      TradeIn.findByPk.mockResolvedValue(mockTradeIn);

      const res = await request(app)
        .put("/trade-in/1/status")
        .send({ status: "completed", estimatedValue: 100 });

      expect(res.statusCode).toBe(200);
      expect(mockTradeIn.update).toHaveBeenCalledWith({
        status: "completed",
        estimatedValue: 100,
      });
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });

    it("should handle trade-in request not found", async () => {
      TradeIn.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .put("/trade-in/999/status")
        .send({ status: "approved", estimatedValue: 100 });

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: "Trade-in request not found" });
    });

    it("should handle errors when updating trade-in status", async () => {
      TradeIn.findByPk.mockRejectedValue(new Error("Database error"));

      const res = await request(app)
        .put("/trade-in/1/status")
        .send({ status: "approved", estimatedValue: 100 });

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });
});
