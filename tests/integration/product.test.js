const request = require("supertest");
const express = require("express");

// Mock the models
jest.mock("../../src/models", () => {
  const SequelizeMock = {
    Op: {
      in: Symbol("in"),
      notIn: Symbol("notIn"),
      gte: Symbol("gte"),
      lte: Symbol("lte"),
      ne: Symbol("ne"),
      eq: Symbol("eq"),
      like: Symbol("like"),
    },
  };

  return {
    Product: {
      findAll: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    User: {},
    Order: {
      findAll: jest.fn(),
    },
    Review: {},
    Sequelize: SequelizeMock,
  };
});

// Mock the services
jest.mock("../../src/services/sustainabilityService", () => ({
  calculateProductSustainabilityScore: jest.fn(),
}));

jest.mock("../../src/services/searchService", () => ({
  searchProducts: jest.fn(),
}));

jest.mock("../../src/services/recommendationService", () => ({
  getRecommendedProducts: jest.fn(),
  getSimilarProducts: jest.fn(),
  getTrendingProducts: jest.fn(),
}));

jest.mock("../../src/services/blockchainService", () => ({
  addProductEvent: jest.fn(),
  getProductHistory: jest.fn(),
}));

// Mock the session
const mockSession = {
  getUserId: jest.fn().mockReturnValue('mockUserId'),
};

// Mock the auth middleware
jest.mock("../../src/middlewares/authMiddleware", () => ({
  requireAuth: (req, res, next) => {
    req.session = mockSession;
    next();
  },
}));

// Import the mocked modules
const { Product } = require("../../src/models");
const sustainabilityService = require("../../src/services/sustainabilityService");
const searchService = require("../../src/services/searchService");
const recommendationService = require("../../src/services/recommendationService");
const blockchainService = require("../../src/services/blockchainService");

const app = express();
const productRoutes = require("../../src/routes/productRoutes");

app.use(express.json());
app.use("/products", productRoutes);

describe("Product Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /products", () => {
    it("should return all products", async () => {
      const mockProducts = [
        { id: 1, name: "Product 1" },
        { id: 2, name: "Product 2" },
      ];
      Product.findAll.mockResolvedValue(mockProducts);

      const res = await request(app).get("/products");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockProducts);
    });
  });

  describe("GET /products/:id", () => {
    it("should return a product by id", async () => {
      const mockProduct = { id: 1, name: "Product 1" };
      Product.findByPk.mockResolvedValue(mockProduct);

      const res = await request(app).get("/products/1");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockProduct);
    });

    it("should return 404 if product not found", async () => {
      Product.findByPk.mockResolvedValue(null);

      const res = await request(app).get("/products/999");

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: "Product not found" });
    });
  });

  describe("POST /products", () => {
    it("should create a new product", async () => {
      const mockProduct = {
        id: 1,
        name: "New Product",
        sustainabilityScore: 80,
      };
      sustainabilityService.calculateProductSustainabilityScore.mockReturnValue(
        80
      );
      Product.create.mockResolvedValue(mockProduct);
      blockchainService.addProductEvent.mockResolvedValue();

      const res = await request(app)
        .post("/products")
        .send({ name: "New Product" });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(mockProduct);
    });
  });

  describe("PUT /products/:id", () => {
    it("should update a product", async () => {
      sustainabilityService.calculateProductSustainabilityScore.mockReturnValue(
        90
      );
      Product.update.mockResolvedValue([1]);
      blockchainService.addProductEvent.mockResolvedValue();

      const res = await request(app)
        .put("/products/1")
        .send({ name: "Updated Product" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: "Product updated successfully" });
    });

    it("should return 404 if product not found", async () => {
      Product.update.mockResolvedValue([0]);

      const res = await request(app)
        .put("/products/999")
        .send({ name: "Updated Product" });

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: "Product not found" });
    });
  });

  describe("GET /products/search", () => {
    it("should search products", async () => {
      const mockSearchResults = [{ id: 1, name: "Product 1" }];
      searchService.searchProducts.mockResolvedValue(mockSearchResults);

      const res = await request(app).get("/products/search?query=test");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockSearchResults);
    });
  });

  describe("GET /products/recommended", () => {
    let consoleErrorSpy;

    beforeEach(() => {
      consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it("should return recommended products", async () => {
      const mockRecommendedProducts = [{ id: 1, name: "Recommended Product" }];
      recommendationService.getRecommendedProducts.mockResolvedValue(
        mockRecommendedProducts
      );

      const res = await request(app).get("/products/recommended");

      expect(mockSession.getUserId).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockRecommendedProducts);
    });

    it("should handle errors when fetching recommended products", async () => {
      recommendationService.getRecommendedProducts.mockRejectedValue(
        new Error("Recommendation error")
      );

      const res = await request(app).get("/products/recommended");

      expect(mockSession.getUserId).toHaveBeenCalled();
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });

  describe("GET /products/trending", () => {
    it("should return trending products", async () => {
      const mockTrendingProducts = [{ id: 1, name: "Trending Product" }];
      recommendationService.getTrendingProducts.mockResolvedValue(
        mockTrendingProducts
      );

      const res = await request(app).get("/products/trending");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockTrendingProducts);
    });
  });

  describe("GET /products/similar/:productId", () => {
    it("should return similar products", async () => {
      const mockSimilarProducts = [{ id: 2, name: "Similar Product" }];
      recommendationService.getSimilarProducts.mockResolvedValue(
        mockSimilarProducts
      );

      const res = await request(app).get("/products/similar/1");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockSimilarProducts);
    });
  });

  describe("GET /products/:id/history", () => {
    it("should return product history", async () => {
      const mockHistory = [
        { event: "Product Created", timestamp: "2023-01-01" },
      ];
      blockchainService.getProductHistory.mockResolvedValue(mockHistory);

      const res = await request(app).get("/products/1/history");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockHistory);
    });
  });
});
