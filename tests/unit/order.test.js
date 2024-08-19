const orderController = require("../../src/controllers/orderController");
const { Order, Product, User } = require("../../src/models");
const notificationService = require("../../src/services/notificationService");
const gamificationService = require("../../src/services/gamificationService");
const paymentService = require("../../src/services/paymentService");


// Mocks
jest.mock("../../src/models", () => ({
  Order: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
  Product: {},
  User: {
    findByPk: jest.fn(),
  },
}));

jest.mock("../../src/services/notificationService", () => ({
  sendNotification: jest.fn(),
}));

jest.mock("../../src/services/gamificationService", () => ({
  awardPoints: jest.fn(),
  checkAchievements: jest.fn(),
}));

jest.mock("../../src/services/paymentService", () => ({
  createPaymentIntent: jest.fn(),
  confirmPayment: jest.fn(),
}));

describe("Order Controller", () => {
    const originalConsoleError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalConsoleError;
    });
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

  describe("createOrder", () => {
    it("should create a new order successfully", async () => {
      const mockOrder = { id: "1", totalAmount: 100 };
      const mockPaymentIntent = { id: "pi_123", client_secret: "cs_123" };

      mockReq.body = { products: ["1", "2"], totalAmount: 100 };
      Order.create.mockResolvedValue({ ...mockOrder, setProducts: jest.fn() });
      paymentService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);

      await orderController.createOrder(mockReq, mockRes);

      expect(paymentService.createPaymentIntent).toHaveBeenCalledWith(100);
      expect(Order.create).toHaveBeenCalledWith({
        UserId: "testUserId",
        totalAmount: 100,
        status: "pending",
        paymentIntentId: "pi_123",
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        order: expect.objectContaining(mockOrder),
        clientSecret: "cs_123",
      });
    });

    it("should handle errors and return 500 status", async () => {
      Order.create.mockRejectedValue(new Error("Database error"));

      await orderController.createOrder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("confirmOrder", () => {
    it("should confirm an order successfully", async () => {
      const mockUser = {
        id: "testUserId",
        sustainabilityScore: 85,
        save: jest.fn().mockResolvedValue(true),
      };
      const mockOrder = {
        id: "1",
        UserId: "testUserId",
        totalAmount: 100,
        status: "pending",
        save: jest.fn().mockResolvedValue(true),
        Products: [{ sustainabilityScore: 80 }, { sustainabilityScore: 90 }],
        User: mockUser,
      };
      const mockPaymentIntent = { status: "succeeded" };

      mockReq.body = { orderId: "1", paymentIntentId: "pi_123" };
      Order.findByPk.mockResolvedValue(mockOrder);
      paymentService.confirmPayment.mockResolvedValue(mockPaymentIntent);

      await orderController.confirmOrder(mockReq, mockRes);

      expect(paymentService.confirmPayment).toHaveBeenCalledWith("pi_123");
      expect(mockOrder.status).toBe("paid");
      expect(mockOrder.save).toHaveBeenCalled();
      expect(gamificationService.awardPoints).toHaveBeenCalledWith(
        "testUserId",
        100,
        "making a purchase"
      );
      expect(gamificationService.checkAchievements).toHaveBeenCalledWith(
        "testUserId"
      );
      expect(mockUser.sustainabilityScore).toBe(85); // (85 + 85) / 2, rounded
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Payment confirmed and order updated",
      });
    });


    it("should return 404 when order is not found", async () => {
      Order.findByPk.mockResolvedValue(null);
      mockReq.body = { orderId: "999", paymentIntentId: "pi_123" };

      await orderController.confirmOrder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Order not found" });
    });

    it("should handle payment failure", async () => {
      const mockOrder = { id: "1", status: "pending", save: jest.fn() };
      const mockPaymentIntent = { status: "failed" };

      mockReq.body = { orderId: "1", paymentIntentId: "pi_123" };
      Order.findByPk.mockResolvedValue(mockOrder);
      paymentService.confirmPayment.mockResolvedValue(mockPaymentIntent);

      await orderController.confirmOrder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Payment failed" });
    });
  });

});
