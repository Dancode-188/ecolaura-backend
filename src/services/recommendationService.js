const { User, Product, Order, Sequelize } = require("../models");
const Op = Sequelize.Op;

const getProductCategories = async (userId) => {
  const user = await User.findByPk(userId, {
    include: {
      model: Order,
      include: {
        model: Product,
        attributes: ["category"],
      },
    },
  });

  const categories = user.Orders.flatMap((order) =>
    order.Products.map((product) => product.category)
  );

  return [...new Set(categories)]; // Remove duplicates
};

const getUserSustainabilityPreference = async (userId) => {
  const user = await User.findByPk(userId);
  return user.sustainabilityScore;
};

exports.getRecommendedProducts = async (userId, limit = 10) => {
  const userCategories = await getProductCategories(userId);
  const userSustainabilityPreference = await getUserSustainabilityPreference(
    userId
  );

  // Find products in the user's preferred categories with high sustainability scores
  const recommendedProducts = await Product.findAll({
    where: {
      category: {
        [Op.in]: userCategories,
      },
      sustainabilityScore: {
        [Op.gte]: userSustainabilityPreference,
      },
    },
    order: [
      ["sustainabilityScore", "DESC"],
      [Sequelize.fn("RANDOM")], // Add some randomness to the recommendations
    ],
    limit: limit,
  });

  // If we don't have enough recommendations, add some high sustainability products from other categories
  if (recommendedProducts.length < limit) {
    const additionalProducts = await Product.findAll({
      where: {
        category: {
          [Op.notIn]: userCategories,
        },
        sustainabilityScore: {
          [Op.gte]: userSustainabilityPreference,
        },
      },
      order: [["sustainabilityScore", "DESC"], [Sequelize.fn("RANDOM")]],
      limit: limit - recommendedProducts.length,
    });

    recommendedProducts.push(...additionalProducts);
  }

  return recommendedProducts;
};

exports.getNewArrivals = async (limit = 5) => {
  return await Product.findAll({
    order: [["createdAt", "DESC"]],
    limit: limit,
  });
};

exports.getTrendingProducts = async (limit = 5) => {
  // This is a simplified version. In a real-world scenario, you might want to
  // consider factors like recent sales volume, view counts, etc.
  const oneWeekAgo = new Date(new Date() - 7 * 24 * 60 * 60 * 1000);

  const trendingProducts = await Order.findAll({
    attributes: [
      "ProductId",
      [Sequelize.fn("COUNT", Sequelize.col("ProductId")), "orderCount"],
    ],
    where: {
      createdAt: {
        [Op.gte]: oneWeekAgo,
      },
    },
    include: [
      {
        model: Product,
        attributes: [
          "id",
          "name",
          "price",
          "sustainabilityScore",
          "description",
        ],
      },
    ],
    group: ["ProductId", "Product.id"],
    order: [[Sequelize.literal("orderCount"), "DESC"]],
    limit: limit,
  });

  return trendingProducts.map((tp) => tp.Product);
};
