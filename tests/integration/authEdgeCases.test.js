const request = require("supertest");
const app = require("../../src/app");
const { User } = require("../../src/models");

describe("Authentication Edge Cases", () => {
  beforeEach(async () => {
    await User.destroy({ where: {} }); // Clear users before each test
  });

  test("Register with existing email", async () => {
    await User.create({
      email: "existing@example.com",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/register").send({
      email: "existing@example.com",
      password: "newpassword123",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toContain("Email already exists");
  });

  test("Login with incorrect password", async () => {
    await User.create({
      email: "user@example.com",
      password: "correctpassword",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "user@example.com",
      password: "incorrectpassword",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid credentials");
  });

  test("Login with non-existent user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nonexistent@example.com",
      password: "somepassword",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid credentials");
  });

  test("Use expired token", async () => {
    // This test assumes you have a way to generate an expired token
    const expiredToken = "your_expired_token_here";

    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Token expired");
  });
});
