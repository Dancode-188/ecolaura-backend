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

  test("Update a product", async () => {
    const product = await Product.create({
      name: "Original Product",
      description: "Original description",
      price: 10.99,
    });

    const res = await request(app)
      .put(`/api/products/${product.id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Updated Product",
        price: 15.99,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Product updated successfully");

    const updatedProduct = await Product.findByPk(product.id);
    expect(updatedProduct.name).toBe("Updated Product");
    expect(updatedProduct.price).toBe(15.99);
  });

  test("Delete a product", async () => {
    const product = await Product.create({
      name: "Product to Delete",
      description: "This product will be deleted",
      price: 5.99,
    });

    const res = await request(app)
      .delete(`/api/products/${product.id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Product deleted successfully");

    const deletedProduct = await Product.findByPk(product.id);
    expect(deletedProduct).toBeNull();
  });

  test("Search products", async () => {
    await Product.bulkCreate([
      {
        name: "Eco Bottle",
        description: "Reusable water bottle",
        price: 15.99,
      },
      {
        name: "Solar Charger",
        description: "Portable solar charger",
        price: 29.99,
      },
      {
        name: "Bamboo Toothbrush",
        description: "Eco-friendly toothbrush",
        price: 5.99,
      },
    ]);

    const res = await request(app).get("/api/products/search?query=eco");

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty("name", "Eco Bottle");
    expect(res.body[1]).toHaveProperty("name", "Bamboo Toothbrush");
  });
});
