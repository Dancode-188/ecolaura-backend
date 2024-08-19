const { User, Product, Order, Review, Sequelize } = require("../../src/models");
const recommendationService = require("../../src/services/recommendationService");

// Mocks
jest.mock("../../src/models", () => ({
  User: {
    findByPk: jest.fn(),
  },
  Product: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
  Order: {
    findAll: jest.fn(),
  },
  Review: {},
  Sequelize: {
    Op: {
      in: Symbol("in"),
      notIn: Symbol("notIn"),
      gte: Symbol("gte"),
      ne: Symbol("ne"),
      between: Symbol("between"),
    },
    fn: jest.fn(),
    col: jest.fn(),
    literal: jest.fn(),
  },
}));

describe("Recommendation Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getRecommendedProducts", () => {
    it("should return recommended products based on user preferences", async () => {
      const mockUserId = "1";
      const mockCategories = ["Electronics", "Home"];
      const mockSustainabilityScore = 80;
      const mockProducts = [
        {
          id: "1",
          name: "Eco Phone",
          category: "Electronics",
          sustainabilityScore: 85,
        },
        {
          id: "2",
          name: "Eco Lamp",
          category: "Home",
          sustainabilityScore: 90,
        },
      ];

      Order.findAll.mockResolvedValueOnce([
        { Products: [{ category: "Electronics" }] },
        { Products: [{ category: "Home" }] },
      ]);
      User.findByPk.mockResolvedValueOnce({
        sustainabilityScore: mockSustainabilityScore,
      });
      Product.findAll
        .mockResolvedValueOnce(mockProducts)
        .mockResolvedValueOnce([]); // Mock empty additional products

      const result = await recommendationService.getRecommendedProducts(
        mockUserId
      );

      expect(Order.findAll).toHaveBeenCalledWith(expect.any(Object));
      expect(User.findByPk).toHaveBeenCalledWith(mockUserId);
      expect(Product.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            category: { [Sequelize.Op.in]: expect.any(Array) },
            sustainabilityScore: {
              [Sequelize.Op.gte]: mockSustainabilityScore,
            },
          },
        })
      );
      expect(result).toEqual(mockProducts);
    });

    it("should add additional products if not enough recommendations", async () => {
      const mockUserId = "1";
      const mockProducts = [
        {
          id: "1",
          name: "Eco Phone",
          category: "Electronics",
          sustainabilityScore: 85,
        },
      ];
      const mockAdditionalProducts = [
        {
          id: "2",
          name: "Eco Lamp",
          category: "Home",
          sustainabilityScore: 90,
        },
      ];

      Order.findAll.mockResolvedValueOnce([
        { Products: [{ category: "Electronics" }] },
      ]);
      User.findByPk.mockResolvedValueOnce({ sustainabilityScore: 80 });
      Product.findAll
        .mockResolvedValueOnce(mockProducts)
        .mockResolvedValueOnce(mockAdditionalProducts);

      const result = await recommendationService.getRecommendedProducts(
        mockUserId,
        2
      );

      expect(Product.findAll).toHaveBeenCalledTimes(2);
      // The function should return all products found, without duplicating them
      expect(result).toEqual(
        expect.arrayContaining([...mockProducts, ...mockAdditionalProducts])
      );
      expect(result.length).toBe(2); // Ensure we're getting the correct number of products
    });
  });

  describe("getSimilarProducts", () => {
    it("should return similar products", async () => {
      const mockProductId = "1";
      const mockProduct = {
        id: "1",
        category: "Electronics",
        sustainabilityScore: 85,
      };
      const mockSimilarProducts = [
        {
          id: "2",
          name: "Similar Eco Phone",
          category: "Electronics",
          sustainabilityScore: 80,
        },
      ];

      Product.findByPk.mockResolvedValueOnce(mockProduct);
      Product.findAll.mockResolvedValueOnce(mockSimilarProducts);

      const result = await recommendationService.getSimilarProducts(
        mockProductId
      );

      expect(Product.findByPk).toHaveBeenCalledWith(mockProductId);
      expect(Product.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: { [Sequelize.Op.ne]: mockProductId },
            category: mockProduct.category,
            sustainabilityScore: { [Sequelize.Op.between]: [75, 95] },
          },
        })
      );
      expect(result).toEqual(mockSimilarProducts);
    });

    it("should throw an error if product is not found", async () => {
      Product.findByPk.mockResolvedValueOnce(null);

      await expect(
        recommendationService.getSimilarProducts("999")
      ).rejects.toThrow("Product not found");
    });
  });

  describe("getTrendingProducts", () => {
    it("should return trending products", async () => {
      const mockTrendingProducts = [
        {
          Product: {
            id: "1",
            name: "Trending Eco Product",
            sustainabilityScore: 95,
          },
        },
      ];

      Order.findAll.mockResolvedValueOnce(mockTrendingProducts);

      const result = await recommendationService.getTrendingProducts();

      expect(Order.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: { [Sequelize.Op.gte]: expect.any(Date) },
          },
          include: [
            {
              model: Product,
              where: {
                sustainabilityScore: { [Sequelize.Op.gte]: 70 },
              },
            },
          ],
        })
      );
      expect(result).toEqual(mockTrendingProducts.map((tp) => tp.Product));
    });
  });
});
