const { User, Order, Product, Sequelize } = require("../models");
const Op = Sequelize.Op;

exports.calculateUserSustainabilityMetrics = async (userId) => {
  const user = await User.findByPk(userId, {
    include: {
      model: Order,
      include: Product,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  let totalProducts = 0;
  let totalSustainabilityScore = 0;
  let carbonSaved = 0;
  let waterSaved = 0;
  let plasticReduced = 0;

  user.Orders.forEach((order) => {
    order.Products.forEach((product) => {
      totalProducts++;
      totalSustainabilityScore += product.sustainabilityScore;

      // These calculations are hypothetical and should be adjusted based on real data
      carbonSaved += (100 - product.carbonFootprint) * 0.1; // kg of CO2
      waterSaved += product.sustainabilityScore * 2; // liters
      plasticReduced += product.sustainablePackaging ? 0.1 : 0; // kg
    });
  });

  const averageSustainabilityScore =
    totalProducts > 0 ? totalSustainabilityScore / totalProducts : 0;

  return {
    totalPurchases: totalProducts,
    averageSustainabilityScore: Math.round(averageSustainabilityScore),
    carbonSaved: Math.round(carbonSaved),
    waterSaved: Math.round(waterSaved),
    plasticReduced: Math.round(plasticReduced * 10) / 10,
  };
};

exports.getTopSustainableProducts = async (limit = 5) => {
  return await Product.findAll({
    order: [["sustainabilityScore", "DESC"]],
    limit: limit,
  });
};

exports.getUserSustainabilityRank = async (userId) => {
  const users = await User.findAll({
    attributes: ["id", "sustainabilityScore"],
    order: [["sustainabilityScore", "DESC"]],
  });

  const userRank = users.findIndex((user) => user.id === userId) + 1;
  const totalUsers = users.length;

  return {
    rank: userRank,
    percentile: Math.round((1 - userRank / totalUsers) * 100),
  };
};
