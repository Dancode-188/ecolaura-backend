const { Op } = require("sequelize");
const { Product } = require("../../src/models");
const searchService = require("../../src/services/searchService");

// Mock the Sequelize model
jest.mock("../../src/models", () => ({
  Product: {
    findAndCountAll: jest.fn(),
  },
}));

describe("Search Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("searchProducts", () => {
    it("should search products with default parameters", async () => {
      const mockProducts = [
        { id: 1, name: "Product 1" },
        { id: 2, name: "Product 2" },
      ];
      Product.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: mockProducts,
      });

      const result = await searchService.searchProducts({});

      expect(Product.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        order: [["createdAt", "DESC"]],
        limit: 10,
        offset: 0,
      });
      expect(result).toEqual({
        products: mockProducts,
        totalPages: 1,
        currentPage: 1,
        totalProducts: 2,
      });
    });

    it("should search products with specific search term", async () => {
      const mockProducts = [{ id: 1, name: "Eco Product" }];
      Product.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockProducts,
      });

      const result = await searchService.searchProducts({ search: "eco" });

      expect(Product.findAndCountAll).toHaveBeenCalledWith({
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: "%eco%" } },
            { description: { [Op.iLike]: "%eco%" } },
          ],
        },
        order: [["createdAt", "DESC"]],
        limit: 10,
        offset: 0,
      });
      expect(result.products).toEqual(mockProducts);
    });

    it("should filter products by category", async () => {
      const mockProducts = [
        { id: 1, name: "Eco Product", category: "Electronics" },
      ];
      Product.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockProducts,
      });

      const result = await searchService.searchProducts({
        category: "Electronics",
      });

      expect(Product.findAndCountAll).toHaveBeenCalledWith({
        where: { category: "Electronics" },
        order: [["createdAt", "DESC"]],
        limit: 10,
        offset: 0,
      });
      expect(result.products).toEqual(mockProducts);
    });

    it("should filter products by price range", async () => {
      const mockProducts = [{ id: 1, name: "Eco Product", price: 50 }];
      Product.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockProducts,
      });

      const result = await searchService.searchProducts({
        minPrice: 40,
        maxPrice: 60,
      });

      expect(Product.findAndCountAll).toHaveBeenCalledWith({
        where: {
          price: {
            [Op.gte]: 40,
            [Op.lte]: 60,
          },
        },
        order: [["createdAt", "DESC"]],
        limit: 10,
        offset: 0,
      });
      expect(result.products).toEqual(mockProducts);
    });

    it("should filter products by minimum sustainability score", async () => {
      const mockProducts = [
        { id: 1, name: "Eco Product", sustainabilityScore: 80 },
      ];
      Product.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockProducts,
      });

      const result = await searchService.searchProducts({
        minSustainabilityScore: 75,
      });

      expect(Product.findAndCountAll).toHaveBeenCalledWith({
        where: {
          sustainabilityScore: { [Op.gte]: 75 },
        },
        order: [["createdAt", "DESC"]],
        limit: 10,
        offset: 0,
      });
      expect(result.products).toEqual(mockProducts);
    });

    it("should sort products by price ascending", async () => {
      const mockProducts = [
        { id: 1, name: "Cheap Product", price: 10 },
        { id: 2, name: "Expensive Product", price: 100 },
      ];
      Product.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: mockProducts,
      });

      const result = await searchService.searchProducts({
        sortBy: "price_asc",
      });

      expect(Product.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        order: [["price", "ASC"]],
        limit: 10,
        offset: 0,
      });
      expect(result.products).toEqual(mockProducts);
    });

  });
});
