const request = require("supertest");
const app = require("../../src/app");
const { User, Product } = require("../../src/models");

describe("API Performance Tests", () => {
  let authToken;

  beforeAll(async () => {
    // Create a user and login
    const user = await User.create({
      email: "performance@example.com",
      password: "password123",
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "performance@example.com",
      password: "password123",
    });
    authToken = loginRes.body.token;

    // Create multiple products for testing
    const products = Array(100)
      .fill()
      .map((_, i) => ({
        name: `Product ${i}`,
        description: `Description for product ${i}`,
        price: 10 + i,
      }));
    await Product.bulkCreate(products);
  });

  test("Get all products - response time", async () => {
    const start = Date.now();
    const res = await request(app).get("/api/products");
    const end = Date.now();
    const responseTime = end - start;

    expect(res.statusCode).toBe(200);
    expect(responseTime).toBeLessThan(200); // Assuming response should be under 200ms
  });

  test("Search products - response time", async () => {
    const start = Date.now();
    const res = await request(app).get("/api/products/search?query=Product");
    const end = Date.now();
    const responseTime = end - start;

    expect(res.statusCode).toBe(200);
    expect(responseTime).toBeLessThan(100); // Assuming search should be faster, under 100ms
  });

  test("Create order - response time", async () => {
    const start = Date.now();
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        products: [1, 2, 3], // Assuming these product IDs exist
        totalAmount: 100,
      });
    const end = Date.now();
    const responseTime = end - start;

    expect(res.statusCode).toBe(201);
    expect(responseTime).toBeLessThan(300); // Assuming order creation should be under 300ms
  });
});
