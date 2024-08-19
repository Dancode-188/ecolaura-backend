const request = require("supertest");
const express = require("express");

jest.mock("supertokens-node/recipe/session/framework/express", () => ({
  verifySession: jest.fn().mockImplementation((handler) => handler),
}));

jest.mock("../../src/models", () => ({
  User: {
    findByPk: jest.fn(),
  },
  Admin: {
    findOne: jest.fn(),
  },
  Notification: {
    create: jest.fn(),
  },
  Subscription: {
    findAll: jest.fn(),
  },
  SubscriptionBox: {},
}));

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      confirm: jest.fn(),
    },
  }));
});

jest.mock("firebase-admin", () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  messaging: jest.fn().mockReturnValue({
    send: jest.fn(),
  }),
}));

jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn(),
  }),
}));

describe("Error Handling and Edge Cases", () => {
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

  describe("Authentication", () => {
    test("should handle admin authentication failure", async () => {
      const {
        requireAdminAuth,
      } = require("../../src/middlewares/authMiddleware");
      const { Admin } = require("../../src/models");

      Admin.findOne.mockResolvedValue(null);

      const mockReq = {
        session: {
          getUserId: jest.fn().mockReturnValue("user123"),
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockNext = jest.fn();

      await requireAdminAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Access denied. Admin rights required.",
      });
    });
  });

  describe("Payments", () => {
    test("should handle Stripe API error", async () => {
      const mockStripe = {
        paymentIntents: {
          create: jest.fn().mockRejectedValue(new Error("Stripe API Error")),
        },
      };
      jest.mock("stripe", () => jest.fn(() => mockStripe));

      jest.mock("../../src/services/paymentService", () => ({
        createPaymentIntent: jest.requireActual(
          "../../src/services/paymentService"
        ).createPaymentIntent,
      }));

      const {
        createPaymentIntent,
      } = require("../../src/services/paymentService");

      await expect(createPaymentIntent(100, "usd")).rejects.toThrow(
        "Stripe API Error"
      );

      jest.unmock("stripe");
      jest.unmock("../../src/services/paymentService");
    });


    test("should handle invalid payment amount", async () => {
      const {
        createPaymentIntent,
      } = require("../../src/services/paymentService");

      await expect(createPaymentIntent(-100, "usd")).rejects.toThrow(
        "Invalid payment amount"
      );
    });
  });

  describe("Notifications", () => {
    test("should handle Firebase messaging error", async () => {
      const admin = require("firebase-admin");
      const { User, Notification } = require("../../src/models");
      User.findByPk.mockResolvedValue({
        id: 1,
        fcmToken: "invalid_token",
        email: "test@example.com",
      });
      Notification.create.mockResolvedValue({ id: 1 });
      admin
        .messaging()
        .send.mockRejectedValue(new Error("Firebase Messaging Error"));

      const {
        sendNotification,
      } = require("../../src/services/notificationService");

      await expect(sendNotification(1, "Test message")).rejects.toThrow(
        "Firebase Messaging Error"
      );
    });

    test("should handle user not found", async () => {
      const { User } = require("../../src/models");
      User.findByPk.mockResolvedValue(null);

      const {
        sendNotification,
      } = require("../../src/services/notificationService");

      await expect(sendNotification(999, "Test message")).rejects.toThrow(
        "User not found"
      );
    });
  });

  describe("Subscription Management", () => {
    test("should handle invalid subscription frequency", () => {
      const {
        calculateNextDeliveryDate,
      } = require("../../src/services/notificationService");

      expect(() => calculateNextDeliveryDate("invalid_frequency")).toThrow(
        "Invalid frequency"
      );
    });
  });
});
