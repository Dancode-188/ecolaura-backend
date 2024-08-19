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

});
