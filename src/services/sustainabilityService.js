const { Product, User } = require("../models");

// Hypothetical factors for sustainability score calculation
const FACTORS = {
  RECYCLED_MATERIALS: 2,
  ENERGY_EFFICIENCY: 1.5,
  CARBON_FOOTPRINT: 2,
  PACKAGING: 1,
  DURABILITY: 1.5,
};

exports.calculateProductSustainabilityScore = (product) => {
  let score = 0;
  score +=
    (product.recycledMaterialPercentage / 100) *
    FACTORS.RECYCLED_MATERIALS *
    20;
  score +=
    (product.energyEfficiencyRating / 5) * FACTORS.ENERGY_EFFICIENCY * 20;
  score +=
    ((100 - product.carbonFootprint) / 100) * FACTORS.CARBON_FOOTPRINT * 20;
  score += (product.sustainablePackaging ? 1 : 0) * FACTORS.PACKAGING * 20;
  score += (product.expectedLifespan / 10) * FACTORS.DURABILITY * 20;

  return Math.min(Math.round(score), 100); // Ensure the score doesn't exceed 100
};

exports.updateUserSustainabilityScore = async (userId) => {
  const user = await User.findByPk(userId, {
    include: {
      model: Order,
      include: Product,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  let totalScore = 0;
  let totalProducts = 0;

  user.Orders.forEach((order) => {
    order.Products.forEach((product) => {
      totalScore += product.sustainabilityScore;
      totalProducts++;
    });
  });

  const averageScore =
    totalProducts > 0 ? Math.round(totalScore / totalProducts) : 0;

  await user.update({ sustainabilityScore: averageScore });

  return averageScore;
};
