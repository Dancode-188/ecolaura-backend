const request = require("supertest");
const app = require("../../src/app");
const { User } = require("../../src/models");

describe("Error Handling", () => {
  let authToken;

  beforeAll(async () => {
    const user = await User.create({
      email: "error@example.com",
      password: "password123",
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "error@example.com",
      password: "password123",
    });
    authToken = loginRes.body.token;
  });

  test("404 Not Found", async () => {
    const res = await request(app).get("/api/non-existent-route");
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Not Found");
  });

  test("400 Bad Request - Invalid Input", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        // Missing required fields
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toContain("validation failed");
  });

  test("401 Unauthorized - No Token", async () => {
    const res = await request(app).get("/api/users/profile");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Unauthorized");
  });

  test("403 Forbidden - Insufficient Permissions", async () => {
    // Assuming there's an admin-only route
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("message", "Forbidden");
  });
});
