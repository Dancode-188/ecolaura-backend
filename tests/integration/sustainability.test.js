const request = require("supertest");
const app = require("../../src/app");
const { User, SustainabilityGoal } = require("../../src/models");

describe("Sustainability Features API", () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    const user = await User.create({
      email: "eco@example.com",
      password: "password123",
    });
    userId = user.id;

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "eco@example.com",
      password: "password123",
    });
    authToken = loginRes.body.token;
  });

  test("Set a sustainability goal", async () => {
    const res = await request(app)
      .post("/api/sustainability-goals")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Reduce plastic waste",
        description: "Use reusable bags and containers",
        targetValue: 10,
        unit: "items",
        category: "waste",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("title", "Reduce plastic waste");
    expect(res.body).toHaveProperty("status", "in_progress");
  });

  test("Get user sustainability goals", async () => {
    const res = await request(app)
      .get("/api/sustainability-goals")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("title", "Reduce plastic waste");
  });

  test("Update goal progress", async () => {
    const goal = await SustainabilityGoal.findOne({
      where: { UserId: userId },
    });

    const res = await request(app)
      .put(`/api/sustainability-goals/${goal.id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        currentValue: 5,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("currentValue", 5);
  });

  test("Get sustainability dashboard", async () => {
    const res = await request(app)
      .get("/api/users/sustainability-dashboard")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("sustainabilityScore");
    expect(res.body).toHaveProperty("completedGoals");
    expect(res.body).toHaveProperty("carbonSaved");
  });
});
