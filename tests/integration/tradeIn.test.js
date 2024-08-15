const request = require("supertest");
const app = require("../../src/app");
const { User, TradeIn } = require("../../src/models");

describe("Trade-In Program API", () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    const user = await User.create({
      email: "tradein@example.com",
      password: "password123",
    });
    userId = user.id;

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "tradein@example.com",
      password: "password123",
    });
    authToken = loginRes.body.token;
  });

  test("Submit a trade-in request", async () => {
    const res = await request(app)
      .post("/api/trade-in")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        productName: "Old Smartphone",
        condition: "good",
        description: "iPhone X, 64GB, minor scratches",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("status", "pending");
    expect(res.body).toHaveProperty("productName", "Old Smartphone");
  });

  test("Get user trade-in requests", async () => {
    const res = await request(app)
      .get("/api/trade-in/user")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("productName", "Old Smartphone");
  });

  test("Update trade-in request status (admin operation)", async () => {
    const tradeIn = await TradeIn.findOne({ where: { UserId: userId } });

    const res = await request(app)
      .put(`/api/trade-in/${tradeIn.id}/status`)
      .set("Authorization", `Bearer ${authToken}`) // Assume this token has admin rights
      .send({
        status: "approved",
        estimatedValue: 150.0,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "approved");
    expect(res.body).toHaveProperty("estimatedValue", 150.0);
  });
});
