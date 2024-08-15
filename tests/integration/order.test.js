const request = require("supertest");
const app = require("../../src/app");
const { User, Product } = require("../../src/models");

describe("Order API", () => {
  let authToken;
  let testProduct;

  beforeAll(async () => {
    // Create a user and login
    await User.create({
      email: "order@example.com",
      password: "password123",
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "order@example.com",
      password: "password123",
    });
    authToken = loginRes.body.token;

    // Create a test product
    testProduct = await Product.create({
      name: "Test Product",
      description: "Test Description",
      price: 9.99,
    });
  });

  test("Create an order", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        products: [testProduct.id],
        totalAmount: 9.99,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("clientSecret");
  });

  test("Get user orders", async () => {
    const res = await request(app)
      .get("/api/orders/user")
      .set("Authorization", `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});
