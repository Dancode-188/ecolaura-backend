const { User, Product, Order, Review, Sequelize } = require("../models");
const Op = Sequelize.Op;

const getProductCategories = async (userId) => {
  const orders = await Order.findAll({
    where: { UserId: userId },
    include: [{ model: Product, attributes: ["category"] }],
  });

  const categories = orders.flatMap((order) =>
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
      ["averageRating", "DESC"],
      Sequelize.literal("RANDOM()"), // Add some randomness to the recommendations
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
      order: [
        ["sustainabilityScore", "DESC"],
        ["averageRating", "DESC"],
        Sequelize.literal("RANDOM()"),
      ],
      limit: limit - recommendedProducts.length,
    });

    recommendedProducts.push(...additionalProducts);
  }

  return recommendedProducts;
};

exports.getSimilarProducts = async (productId, limit = 5) => {
  const product = await Product.findByPk(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  const similarProducts = await Product.findAll({
    where: {
      id: { [Op.ne]: productId },
      category: product.category,
      sustainabilityScore: {
        [Op.between]: [
          product.sustainabilityScore - 10,
          product.sustainabilityScore + 10,
        ],
      },
    },
    order: [["averageRating", "DESC"], Sequelize.literal("RANDOM()")],
    limit: limit,
  });

  return similarProducts;
};

exports.getTrendingProducts = async (limit = 5) => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const trendingProducts = await Order.findAll({
    attributes: [
      "ProductId",
      [Sequelize.fn("COUNT", Sequelize.col("ProductId")), "orderCount"],
    ],
    where: {
      createdAt: {
        [Op.gte]: oneMonthAgo,
      },
    },
    include: [
      {
        model: Product,
        where: {
          sustainabilityScore: {
            [Op.gte]: 70, // Only consider products with high sustainability scores
          },
        },
      },
    ],
    group: ["ProductId", "Product.id"],
    order: [[Sequelize.literal("orderCount"), "DESC"]],
    limit: limit,
  });

  return trendingProducts.map((tp) => tp.Product);
};
