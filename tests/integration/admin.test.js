const request = require("supertest");
const express = require("express");
const {
  Admin,
  User,
  Product,
  Order,
  SustainabilityPost,
} = require("../../src/models");
const { Op } = require("sequelize");

// Mocks
jest.mock("../../src/models", () => ({
  Admin: {},
  User: {
    count: jest.fn(),
    findAll: jest.fn(),
  },
  Product: {
    count: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
  Order: {
    count: jest.fn(),
    sum: jest.fn(),
  },
  SustainabilityPost: {
    count: jest.fn(),
  },
}));

// Mock auth middleware
jest.mock("../../src/middlewares/authMiddleware", () => ({
  requireAdminAuth: (req, res, next) => next(),
}));

const app = express();
const adminRoutes = require("../../src/routes/adminRoutes");

app.use(express.json());
app.use("/admin", adminRoutes);

describe("Admin Routes", () => {
    const originalConsoleError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalConsoleError;
    });
    beforeEach(() => {
      jest.clearAllMocks();
    });

  describe("GET /admin/dashboard", () => {
    it("should return dashboard stats", async () => {
      User.count.mockResolvedValueOnce(100).mockResolvedValueOnce(10);
      Product.count.mockResolvedValue(50);
      Order.count.mockResolvedValue(200);
      Order.sum.mockResolvedValue(10000);
      SustainabilityPost.count.mockResolvedValue(30);
      Product.findAll.mockResolvedValue([
        { id: 1, name: "Eco Product 1", sustainabilityScore: 95 },
        { id: 2, name: "Eco Product 2", sustainabilityScore: 90 },
      ]);

      const res = await request(app).get("/admin/dashboard");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        totalUsers: 100,
        totalProducts: 50,
        totalOrders: 200,
        totalRevenue: 10000,
        totalSustainabilityPosts: 30,
        newUsersThisMonth: 10,
        topSustainableProducts: expect.any(Array),
      });
    });

    it("should handle errors when fetching dashboard stats", async () => {
      User.count.mockRejectedValue(new Error("Database error"));

      const res = await request(app).get("/admin/dashboard");

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });

  describe("GET /admin/users", () => {
    it("should return all users", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "User 1",
          email: "user1@example.com",
          sustainabilityScore: 80,
          createdAt: new Date("2024-08-18T14:17:03.445Z"),
        },
        {
          id: 2,
          name: "User 2",
          email: "user2@example.com",
          sustainabilityScore: 75,
          createdAt: new Date("2024-08-18T14:17:03.445Z"),
        },
      ];
      User.findAll.mockResolvedValue(
        mockUsers.map((user) => ({
          ...user,
          get: jest.fn().mockReturnValue(user),
          toJSON: jest.fn().mockReturnValue(user),
        }))
      );

      const res = await request(app).get("/admin/users");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(
        mockUsers.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
        }))
      );
    });

    it("should handle errors when fetching users", async () => {
      User.findAll.mockRejectedValue(new Error("Database error"));

      const res = await request(app).get("/admin/users");

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });

  describe("GET /admin/products", () => {
    it("should return all products", async () => {
      const mockProducts = [
        { id: 1, name: "Product 1", price: 19.99 },
        { id: 2, name: "Product 2", price: 29.99 },
      ];
      Product.findAll.mockResolvedValue(mockProducts);

      const res = await request(app).get("/admin/products");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockProducts);
    });

    it("should handle errors when fetching products", async () => {
      Product.findAll.mockRejectedValue(new Error("Database error"));

      const res = await request(app).get("/admin/products");

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });

  describe("PUT /admin/products/:id", () => {
    it("should update a product", async () => {
      Product.update.mockResolvedValue([1]);

      const res = await request(app)
        .put("/admin/products/1")
        .send({ name: "Updated Product", price: 39.99 });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: "Product updated successfully" });
    });

    it("should handle product not found", async () => {
      Product.update.mockResolvedValue([0]);

      const res = await request(app)
        .put("/admin/products/999")
        .send({ name: "Updated Product", price: 39.99 });

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: "Product not found" });
    });

    it("should handle errors when updating a product", async () => {
      Product.update.mockRejectedValue(new Error("Database error"));

      const res = await request(app)
        .put("/admin/products/1")
        .send({ name: "Updated Product", price: 39.99 });

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });
});
