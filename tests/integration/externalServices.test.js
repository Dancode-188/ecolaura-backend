const supertokens = require("supertokens-node");
const stripe = require("stripe");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Mocks
jest.mock("supertokens-node");
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest
        .fn()
        .mockResolvedValue({ id: "pi_123", client_secret: "cs_123" }),
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
    sendMail: jest.fn().mockResolvedValue({ messageId: "123" }),
  }),
}));
jest.mock("../../src/models", () => ({
  User: {
    findByPk: jest.fn(),
  },
  Notification: {
    create: jest.fn(),
  },
}));

// Set environment variables for tests
process.env.SUPERTOKENS_CONNECTION_URI =
  "https://st-dev-8bab1a60-5b5c-11ef-9132-83.aws.supertokens.io";
process.env.SUPERTOKENS_API_KEY = "dNqzD44E0VVeW0";
process.env.API_DOMAIN = "http://localhost:3000";
process.env.WEBSITE_DOMAIN = "http://localhost:3000";
process.env.STRIPE_SECRET_KEY = "ighbhjb";
process.env.FIREBASE_PROJECT_ID = "ecolaura-f";
process.env.FIREBASE_CLIENT_EMAIL =
  "firebase-adminsdk-e8gin@ecolaura-f4424.iam.gserviceaccount.com";
process.env.FIREBASE_PRIVATE_KEY =
  "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC3gIi5wpFa1ocS\nEqEajGT\nDXR5pSWCBWWS4T+fq37p4A+jDxxdGWMZhvdkqv34KtAQTIERXune7XpREXEOdhXL\nWV6pMPHpAgMBAAECggEAFn9ww+2h6pQwvUtYTJ6FOIpSplEuYpKKeqhOT2OB0sMS\np5CxHPUiqqw6HSd31Wn7jnKbuWRyEVQYinWGCjLeSfcFYv6XEUJ2I/oyyDyZ1GkJ\nRVm5gtEftfFuMHhPrUxn0Zm8pHL6GPKb1Kk7WaVph1JyKv1KVbER35NU+36zAZOP\ngLJqCkAJL+ZnFaTm203WIvlniKIGctlDLxKQJn196yBC0NRYrz14Dq4R++2g3NY4\nFR4q2A3JvDFMFF6bLsxsD/zv22JttntL5lYTz2BVt/lbOKVp9c3sLRpYLkbQhrlx\nM0baqcey4iIYurZcbjblXWnKtpi2tu9po9KDvoPOAQKBgQDorw9LddAq0ABE6IDR\ncwkla+8sacyYyZdYpj+yaxbtm4VzkYpcbdxUfzUfWsA5cjEYTqnYVEvYmnb2BlvC\nZASrDvQ4vpFpr38uoWf5z4epJBaaMdoc5fmUzp11GbYwPsCuNS4W2uYu5QTsuhUk\nlmK0U5hs5ozwPfiYYj9s6kPGQQKBgQDJ49X6Eh9CuZzvDAjOPvi/sUhc6pEDWADB\n9l/9bbRzZOaJMr1iwHWBNqMAustFGkwF9wJQa1czJ6nML9agb/m/4lfA05EYDIvd\nEsg8AxjlFTl4MN3C4bc0NqTJ/TFTbOJIerIWtn1TC/rhbmVEkQ3fkxHCPpmd6hH5\nTxkhN5jRqQKBgAE+HhjLEkeIQNgdXcLAmIXoo6hbEEqomPRSPvjW9ZJjSD0rw89m\njsysuT3noCsuXvDASsvq91S6znPV6NuK6TN4qvk6m1AzLby0A/gjkZfnp28/YOjS\nmZif2dtsPbrYOvMzOYHJvXz2oCYbgE1nuDM6VxAN0ybdTdySecA9KAuBAoGAdi3b\nRL409F8owTm/MdPk0nlZTaK1bkqmbuPkvrnoJqBK3scH23WjkxbDhhrSAEprdBZq\nkV60NaqjF3ZtYY8KmEtLaQGvbm9xs+BZu99oRDkPYg7g0UJFdtgB0IdYx2f2ccz4\n0JjUdbeOjUWNG/z5LQWvIJB6Zdjt2o11vV8JIrkCgYEA4me3KfD0llPkWizJ5CQQ\nWpk7rPFRsFbWMkyCld1DrdzDG3b7gfMqvJepkF1SlONo/g+giNPGsjFaSB9Am2Rg\nlUaBMPJf/z6JxBlicA//iriYYrTZtI0XQnVPTED4eVjOXRoVlA7ut0uqzWqeCpyo\nRQtEvG5BMhOSV8e/qiuDtoU=\n-----END PRIVATE KEY-----\n";
process.env.EMAIL_HOST = "smtp.example.com";
process.env.EMAIL_PORT = "587";
process.env.EMAIL_SECURE = "false";
process.env.EMAIL_USER = "your-email@example.com";
process.env.EMAIL_PASS = "your-email-password";

describe("External Service Integrations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("SuperTokens Integration", () => {
    test("should initialize SuperTokens with correct config", () => {
      const supertokensConfig = require("../../src/config/supertokens");
      supertokensConfig.init();

      expect(supertokens.init).toHaveBeenCalledWith(
        expect.objectContaining({
          framework: "express",
          supertokens: {
            connectionURI:
              "https://st-dev-8bab1a60-5b5c-11ef-9132-83.aws.supertokens.io",
            apiKey: "dNqzD44E0VVeW0",
          },
          appInfo: {
            appName: "Ecolaura",
            apiDomain: "http://localhost:3000",
            websiteDomain: "http://localhost:3000",
            apiBasePath: "/auth",
            websiteBasePath: "/auth",
          },
          recipeList: expect.arrayContaining([
            expect.any(Function),
            expect.any(Function),
          ]),
        })
      );
    });
  });

  describe("Stripe Integration", () => {
    test("should create a payment intent", async () => {
      const {
        createPaymentIntent,
      } = require("../../src/services/paymentService");
      const result = await createPaymentIntent(10, "usd");

      expect(stripe).toHaveBeenCalledWith(process.env.STRIPE_SECRET_KEY);
      expect(stripe().paymentIntents.create).toHaveBeenCalledWith({
        amount: 1000, // 10 * 100
        currency: "usd",
      });
      expect(result).toEqual({ id: "pi_123", client_secret: "cs_123" });
    });
  });

  describe("Firebase Integration", () => {
    test("should initialize Firebase Admin SDK", () => {
      const { initializeApp } = require("../../src/config/firebase");
      initializeApp();

      expect(admin.initializeApp).toHaveBeenCalledWith({
        credential: admin.credential.cert(
          expect.objectContaining({
            projectId: "ecolaura-f",
            clientEmail:
              "firebase-adminsdk-e8gin@ecolaura-f4424.iam.gserviceaccount.com",
            privateKey: expect.stringContaining("-----BEGIN PRIVATE KEY-----"),
          })
        ),
      });
    });

    test("should send a push notification", async () => {
      const mockUser = {
        id: 1,
        fcmToken: "user_token",
        email: "test@example.com",
      };
      const mockNotification = { id: 1, message: "Test notification" };
      const { User, Notification } = require("../../src/models");
      User.findByPk.mockResolvedValue(mockUser);
      Notification.create.mockResolvedValue(mockNotification);

      admin.messaging().send.mockResolvedValue("message_id");

      const {
        sendNotification,
      } = require("../../src/services/notificationService");
      await sendNotification(mockUser.id, "Test notification", "info");

      expect(admin.messaging().send).toHaveBeenCalledWith({
        token: mockUser.fcmToken,
        notification: {
          title: "Ecolaura Notification",
          body: "Test notification",
        },
      });

      expect(nodemailer.createTransport().sendMail).toHaveBeenCalled();
    });
  });

  describe("Email Service Integration", () => {
    test("should send an email", async () => {
      const { sendEmail } = require("../../src/services/emailService");
      await sendEmail("test@example.com", "Test Subject", "Test Body");

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.example.com",
        port: "587",
        secure: false,
        auth: {
          user: "your-email@example.com",
          pass: "your-email-password",
        },
      });

      expect(nodemailer.createTransport().sendMail).toHaveBeenCalledWith({
        from: "your-email@example.com",
        to: "test@example.com",
        subject: "Test Subject",
        text: "Test Body",
      });
    });
  });
});
