const request = require("supertest");
const app = require("../../src/app");
const { User } = require("../../src/models");

describe("User Profile Management", () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Create a user and login
    const user = await User.create({
      email: "profile@example.com",
      password: "password123",
      name: "Test User",
    });
    userId = user.id;

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "profile@example.com",
      password: "password123",
    });
    authToken = loginRes.body.token;
  });

  test("Get user profile", async () => {
    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("name", "Test User");
    expect(res.body).toHaveProperty("email", "profile@example.com");
  });

  test("Update user profile", async () => {
    const res = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Updated Name",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Profile updated successfully");

    const updatedUser = await User.findByPk(userId);
    expect(updatedUser.name).toBe("Updated Name");
  });
});
