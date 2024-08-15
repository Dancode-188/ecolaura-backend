const request = require("supertest");
const app = require("../../src/app");
const { Product } = require("../../src/models");

describe("Product API", () => {
  let authToken;

  beforeAll(async () => {
    // Login and get auth token
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "password123",
    });
    authToken = loginRes.body.token;
  });

  test("Create a product", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Eco-friendly Water Bottle",
        description: "Reusable water bottle made from recycled materials",
        price: 19.99,
        recycledMaterialPercentage: 80,
        energyEfficiencyRating: 5,
        carbonFootprint: 10,
        sustainablePackaging: true,
        expectedLifespan: 5,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("name", "Eco-friendly Water Bottle");
  });

  test("Get all products", async () => {
    const res = await request(app).get("/api/products");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test("Get product by id", async () => {
    const product = await Product.create({
      name: "Test Product",
      description: "Test Description",
      price: 9.99,
    });

    const res = await request(app).get(`/api/products/${product.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("name", "Test Product");
  });
});
