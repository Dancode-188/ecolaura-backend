const request = require("supertest");
const app = require("../../src/app");
const { User } = require("../../src/models");

describe("Authentication", () => {
  test("User can register", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "test@example.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "User registered successfully");
  });

  test("User can login", async () => {
    await User.create({
      email: "login@example.com",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "User logged in successfully");
  });
});
