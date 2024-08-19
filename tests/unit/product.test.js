const productController = require("../../src/controllers/productController");
const { Product } = require("../../src/models");
const sustainabilityService = require("../../src/services/sustainabilityService");
const searchService = require("../../src/services/searchService");
const recommendationService = require("../../src/services/recommendationService");
const blockchainService = require("../../src/services/blockchainService");

// Mocks
jest.mock("../../src/models", () => ({
  Product: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

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

describe("Product Controller", () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
      query: {},
      session: {
        getUserId: jest.fn().mockReturnValue("testUserId"),
      },
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllProducts", () => {
    it("should return all products", async () => {
      const mockProducts = [
        { id: "1", name: "Product 1" },
        { id: "2", name: "Product 2" },
      ];
      Product.findAll.mockResolvedValue(mockProducts);

      await productController.getAllProducts(mockReq, mockRes);

      expect(Product.findAll).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockProducts);
    });

    it("should handle errors and return 500 status", async () => {
      Product.findAll.mockRejectedValue(new Error("Database error"));

      await productController.getAllProducts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("getProductById", () => {
    it("should return a product when it exists", async () => {
      const mockProduct = { id: "1", name: "Product 1" };
      Product.findByPk.mockResolvedValue(mockProduct);
      mockReq.params.id = "1";

      await productController.getProductById(mockReq, mockRes);

      expect(Product.findByPk).toHaveBeenCalledWith("1");
      expect(mockRes.json).toHaveBeenCalledWith(mockProduct);
    });

    it("should return 404 when product is not found", async () => {
      Product.findByPk.mockResolvedValue(null);
      mockReq.params.id = "999";

      await productController.getProductById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Product not found",
      });
    });

    it("should handle errors and return 500 status", async () => {
      Product.findByPk.mockRejectedValue(new Error("Database error"));
      mockReq.params.id = "1";

      await productController.getProductById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("createProduct", () => {
    it("should create a new product successfully", async () => {
      const mockProductData = {
        name: "New Product",
        price: 19.99,
        category: "Electronics",
      };
      const mockCreatedProduct = {
        id: "1",
        ...mockProductData,
        sustainabilityScore: 80,
        minSustainabilityScore: 72,
      };

      sustainabilityService.calculateProductSustainabilityScore.mockReturnValue(
        80
      );
      Product.create.mockResolvedValue(mockCreatedProduct);
      blockchainService.addProductEvent.mockResolvedValue();

      mockReq.body = mockProductData;

      await productController.createProduct(mockReq, mockRes);

      expect(
        sustainabilityService.calculateProductSustainabilityScore
      ).toHaveBeenCalledWith(mockProductData);
      expect(Product.create).toHaveBeenCalledWith({
        ...mockProductData,
        sustainabilityScore: 80,
        minSustainabilityScore: 72,
      });
      expect(blockchainService.addProductEvent).toHaveBeenCalledWith(
        "1",
        "Product Created"
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockCreatedProduct);
    });

    it("should handle errors and return 500 status", async () => {
      Product.create.mockRejectedValue(new Error("Database error"));
      mockReq.body = {
        name: "New Product",
        price: 19.99,
        category: "Electronics",
      };

      await productController.createProduct(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("updateProduct", () => {
    it("should update a product successfully", async () => {
      const mockProductData = {
        name: "Updated Product",
        price: 29.99,
        category: "Electronics",
      };

      sustainabilityService.calculateProductSustainabilityScore.mockReturnValue(
        85
      );
      Product.update.mockResolvedValue([1]);
      blockchainService.addProductEvent.mockResolvedValue();

      mockReq.params.id = "1";
      mockReq.body = mockProductData;

      await productController.updateProduct(mockReq, mockRes);

      expect(
        sustainabilityService.calculateProductSustainabilityScore
      ).toHaveBeenCalledWith(mockProductData);
      expect(Product.update).toHaveBeenCalledWith(
        {
          ...mockProductData,
          sustainabilityScore: 85,
          minSustainabilityScore: 76,
        },
        { where: { id: "1" } }
      );
      expect(blockchainService.addProductEvent).toHaveBeenCalledWith(
        "1",
        "Product Updated"
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Product updated successfully",
      });
    });

    it("should return 404 when product is not found", async () => {
      Product.update.mockResolvedValue([0]);
      mockReq.params.id = "999";
      mockReq.body = { name: "Updated Product" };

      await productController.updateProduct(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Product not found",
      });
    });

    it("should handle errors and return 500 status", async () => {
      Product.update.mockRejectedValue(new Error("Database error"));
      mockReq.params.id = "1";
      mockReq.body = { name: "Updated Product" };

      await productController.updateProduct(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

});
