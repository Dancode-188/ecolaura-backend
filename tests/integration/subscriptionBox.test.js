const request = require("supertest");
const app = require("../../src/app");
const { User, SubscriptionBox, Subscription } = require("../../src/models");

describe("Subscription Box API", () => {
  let authToken;
  let userId;
  let subscriptionBoxId;

  beforeAll(async () => {
    // Create a user and login
    const user = await User.create({
      email: "sub@example.com",
      password: "password123",
    });
    userId = user.id;

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "sub@example.com",
      password: "password123",
    });
    authToken = loginRes.body.token;

    // Create a subscription box
    const box = await SubscriptionBox.create({
      name: "Eco Essentials Box",
      description: "Monthly box of eco-friendly essentials",
      price: 29.99,
      frequency: "monthly",
    });
    subscriptionBoxId = box.id;
  });

  test("Subscribe to a box", async () => {
    const res = await request(app)
      .post("/api/subscriptions/subscribe")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        subscriptionBoxId: subscriptionBoxId,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("status", "active");
    expect(res.body).toHaveProperty("SubscriptionBoxId", subscriptionBoxId);
  });

  test("Get user subscriptions", async () => {
    const res = await request(app)
      .get("/api/subscriptions/user")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("SubscriptionBox");
    expect(res.body[0].SubscriptionBox).toHaveProperty(
      "name",
      "Eco Essentials Box"
    );
  });

  test("Update subscription status", async () => {
    const subscription = await Subscription.findOne({
      where: { UserId: userId },
    });

    const res = await request(app)
      .patch(`/api/subscriptions/${subscription.id}/status`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        status: "paused",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Subscription updated successfully"
    );

    const updatedSubscription = await Subscription.findByPk(subscription.id);
    expect(updatedSubscription.status).toBe("paused");
  });
});
