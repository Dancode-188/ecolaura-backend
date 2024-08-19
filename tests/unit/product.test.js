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

  describe("searchProducts", () => {
    it("should return search results", async () => {
      const mockSearchResults = [
        { id: "1", name: "Product 1" },
        { id: "2", name: "Product 2" },
      ];
      searchService.searchProducts.mockResolvedValue(mockSearchResults);
      mockReq.query = { keyword: "test" };

      await productController.searchProducts(mockReq, mockRes);

      expect(searchService.searchProducts).toHaveBeenCalledWith({
        keyword: "test",
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockSearchResults);
    });

    it("should handle errors and return 500 status", async () => {
      searchService.searchProducts.mockRejectedValue(new Error("Search error"));
      mockReq.query = { keyword: "test" };

      await productController.searchProducts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("getRecommendedProducts", () => {
    it("should return recommended products", async () => {
      const mockRecommendedProducts = [
        { id: "1", name: "Recommended Product 1" },
        { id: "2", name: "Recommended Product 2" },
      ];
      recommendationService.getRecommendedProducts.mockResolvedValue(
        mockRecommendedProducts
      );

      await productController.getRecommendedProducts(mockReq, mockRes);

      expect(recommendationService.getRecommendedProducts).toHaveBeenCalledWith(
        "testUserId"
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockRecommendedProducts);
    });

    it("should handle errors and return 500 status", async () => {
      recommendationService.getRecommendedProducts.mockRejectedValue(
        new Error("Recommendation error")
      );

      await productController.getRecommendedProducts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("getSimilarProducts", () => {
    it("should return similar products", async () => {
      const mockSimilarProducts = [
        { id: "2", name: "Similar Product 1" },
        { id: "3", name: "Similar Product 2" },
      ];
      recommendationService.getSimilarProducts.mockResolvedValue(
        mockSimilarProducts
      );
      mockReq.params.productId = "1";

      await productController.getSimilarProducts(mockReq, mockRes);

      expect(recommendationService.getSimilarProducts).toHaveBeenCalledWith(
        "1"
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockSimilarProducts);
    });

    it("should handle errors and return 500 status", async () => {
      recommendationService.getSimilarProducts.mockRejectedValue(
        new Error("Similarity error")
      );
      mockReq.params.productId = "1";

      await productController.getSimilarProducts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("getTrendingProducts", () => {
    it("should return trending products", async () => {
      const mockTrendingProducts = [
        { id: "1", name: "Trending Product 1" },
        { id: "2", name: "Trending Product 2" },
      ];
      recommendationService.getTrendingProducts.mockResolvedValue(
        mockTrendingProducts
      );

      await productController.getTrendingProducts(mockReq, mockRes);

      expect(recommendationService.getTrendingProducts).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockTrendingProducts);
    });

    it("should handle errors and return 500 status", async () => {
      recommendationService.getTrendingProducts.mockRejectedValue(
        new Error("Trending error")
      );

      await productController.getTrendingProducts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("getProductHistory", () => {
    it("should return product history", async () => {
      const mockProductHistory = [
        { event: "Created", timestamp: "2023-01-01" },
        { event: "Updated", timestamp: "2023-01-02" },
      ];
      blockchainService.getProductHistory.mockResolvedValue(mockProductHistory);
      mockReq.params.id = "1";

      await productController.getProductHistory(mockReq, mockRes);

      expect(blockchainService.getProductHistory).toHaveBeenCalledWith("1");
      expect(mockRes.json).toHaveBeenCalledWith(mockProductHistory);
    });

    it("should handle errors and return 500 status", async () => {
      blockchainService.getProductHistory.mockRejectedValue(
        new Error("Blockchain error")
      );
      mockReq.params.id = "1";

      await productController.getProductHistory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

});
