const request = require("supertest");
const express = require("express");
const supertokens = require("supertokens-node");
const Session = require("supertokens-node/recipe/session");
const EmailPassword = require("supertokens-node/recipe/emailpassword");

// Mock SuperTokens
jest.mock("supertokens-node", () => ({
  init: jest.fn(),
  getAllCORSHeaders: jest.fn(() => []),
}));
jest.mock("supertokens-node/recipe/session", () => ({
  createNewSession: jest.fn(),
}));
jest.mock("supertokens-node/recipe/emailpassword", () => ({
  emailPasswordSignUp: jest.fn(),
  emailPasswordSignIn: jest.fn(),
}));

const app = express();
const authRoutes = require("../../src/routes/authRoutes");

app.use(express.json());
app.use("/auth", authRoutes);

describe("Authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      EmailPassword.emailPasswordSignUp.mockResolvedValue({ status: "OK" });

      const res = await request(app)
        .post("/auth/register")
        .send({ email: "test@example.com", password: "password123" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: "User registered successfully" });
    });

    it("should return 400 if registration fails", async () => {
      EmailPassword.emailPasswordSignUp.mockResolvedValue({
        status: "EMAIL_ALREADY_EXISTS_ERROR",
      });

      const res = await request(app)
        .post("/auth/register")
        .send({ email: "existing@example.com", password: "password123" });

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({ message: "EMAIL_ALREADY_EXISTS_ERROR" });
    });
  });

  describe("POST /auth/login", () => {
    it("should log in a user successfully", async () => {
      EmailPassword.emailPasswordSignIn.mockResolvedValue({
        status: "OK",
        user: { id: "userId" },
      });
      Session.createNewSession.mockResolvedValue();

      const res = await request(app)
        .post("/auth/login")
        .send({ email: "test@example.com", password: "password123" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: "User logged in successfully" });
    });

    it("should return 400 if login fails", async () => {
      EmailPassword.emailPasswordSignIn.mockResolvedValue({
        status: "WRONG_CREDENTIALS_ERROR",
      });

      const res = await request(app)
        .post("/auth/login")
        .send({ email: "wrong@example.com", password: "wrongpassword" });

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({ message: "WRONG_CREDENTIALS_ERROR" });
    });
  });
});
