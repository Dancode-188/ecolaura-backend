const request = require("supertest");
const express = require("express");
const { Order, Product, User } = require("../../src/models");
const paymentService = require("../../src/services/paymentService");
const gamificationService = require("../../src/services/gamificationService");
const notificationService = require("../../src/services/notificationService");

// Mocks
jest.mock("../../src/models", () => ({
  Order: {
    create: jest.fn(() => ({
      setProducts: jest.fn().mockResolvedValue(true),
      id: 1,
      status: "pending",
    })),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
  },
  Product: {},
  User: {
    findByPk: jest.fn(),
  },
}));
jest.mock("../../src/services/paymentService");
jest.mock("../../src/services/gamificationService");
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
const orderRoutes = require("../../src/routes/orderRoutes");

app.use(express.json());
app.use("/orders", orderRoutes);

describe("Order Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /orders", () => {
    it("should create a new order", async () => {
      const mockPaymentIntent = { id: "pi_123", client_secret: "cs_123" };
      paymentService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);

      const res = await request(app)
        .post("/orders")
        .send({ products: [1, 2], totalAmount: 100 });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("order");
      expect(res.body).toHaveProperty("clientSecret", "cs_123");
      expect(paymentService.createPaymentIntent).toHaveBeenCalledWith(100);
      expect(Order.create).toHaveBeenCalled();
    });

    it("should handle errors when creating an order", async () => {
      Order.create.mockRejectedValue(new Error("Database error"));

      const res = await request(app)
        .post("/orders")
        .send({ products: [1, 2], totalAmount: 100 });

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });

  describe("GET /orders/user", () => {
    it("should return user orders", async () => {
      const mockOrders = [
        { id: 1, status: "paid" },
        { id: 2, status: "pending" },
      ];
      Order.findAll.mockResolvedValue(mockOrders);

      const res = await request(app).get("/orders/user");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockOrders);
      expect(Order.findAll).toHaveBeenCalledWith({
        where: { UserId: "mockUserId" },
        include: [{ model: Product }],
      });
    });

    it("should handle errors when fetching user orders", async () => {
      Order.findAll.mockRejectedValue(new Error("Database error"));

      const res = await request(app).get("/orders/user");

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });

  describe("POST /orders/confirm", () => {
    it("should confirm an order successfully", async () => {
      const mockOrder = {
        id: 1,
        status: "pending",
        UserId: "mockUserId",
        totalAmount: 100,
        save: jest.fn(),
        Products: [{ sustainabilityScore: 80 }, { sustainabilityScore: 90 }],
      };
      Order.findByPk.mockResolvedValue(mockOrder);
      paymentService.confirmPayment.mockResolvedValue({ status: "succeeded" });
      User.findByPk.mockResolvedValue({
        sustainabilityScore: 70,
        save: jest.fn(),
      });

      const res = await request(app)
        .post("/orders/confirm")
        .send({ orderId: 1, paymentIntentId: "pi_123" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        message: "Payment confirmed and order updated",
      });
      expect(gamificationService.awardPoints).toHaveBeenCalled();
      expect(gamificationService.checkAchievements).toHaveBeenCalled();
    });

    it("should handle payment failure", async () => {
      Order.findByPk.mockResolvedValue({ id: 1 });
      paymentService.confirmPayment.mockResolvedValue({ status: "failed" });

      const res = await request(app)
        .post("/orders/confirm")
        .send({ orderId: 1, paymentIntentId: "pi_123" });

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({ message: "Payment failed" });
    });

    it("should handle order not found", async () => {
      Order.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .post("/orders/confirm")
        .send({ orderId: 999, paymentIntentId: "pi_123" });

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: "Order not found" });
    });
  });

  describe("PUT /orders/:id/status", () => {
    it("should update order status", async () => {
      const mockOrder = {
        id: 1,
        status: "processing",
        User: { id: "mockUserId" },
        Products: [{ name: "Product 1" }, { name: "Product 2" }],
      };
      Order.update.mockResolvedValue([1]);
      Order.findByPk.mockResolvedValue(mockOrder);

      const res = await request(app)
        .put("/orders/1/status")
        .send({ status: "delivered" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockOrder);
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });

    it("should handle order not found when updating status", async () => {
      Order.update.mockResolvedValue([0]);

      const res = await request(app)
        .put("/orders/999/status")
        .send({ status: "delivered" });

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: "Order not found" });
    });
  });
});
