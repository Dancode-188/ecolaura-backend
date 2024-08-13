const { User, Order, Product, SustainabilityGoal } = require("../models");
const analyticsService = require("./analyticsService");

const tipCategories = {
  ORDERING: "ordering",
  SPENDING: "spending",
  IMPACT: "impact",
  GOALS: "goals",
  SCORE: "score",
};

const tips = {
  [tipCategories.ORDERING]: [
    "Try to bundle your orders to reduce packaging and transportation emissions.",
    "Set a goal to increase the percentage of eco-friendly products in your orders.",
    "Consider subscribing to regular deliveries of sustainable essentials to maintain consistent eco-friendly habits.",
  ],
  [tipCategories.SPENDING]: [
    "Invest in high-quality, durable products that last longer to reduce overall consumption.",
    "Look for products with minimal packaging to reduce waste.",
    "Consider second-hand or refurbished items when possible to promote circular economy.",
  ],
  [tipCategories.IMPACT]: [
    "Choose products with higher sustainability scores to maximize your positive impact.",
    "Opt for products made from recycled materials to reduce resource consumption.",
    "Select energy-efficient appliances and products to reduce your carbon footprint.",
  ],
  [tipCategories.GOALS]: [
    "Set smaller, achievable sustainability goals to build momentum.",
    "Create a mix of short-term and long-term goals to maintain motivation.",
    "Share your goals with friends or on the platform to increase accountability.",
  ],
  [tipCategories.SCORE]: [
    "Engage more with the community by sharing your sustainability journey and tips.",
    "Write reviews for eco-friendly products to help others make informed decisions.",
    "Participate in platform challenges and events to boost your sustainability score.",
  ],
};

exports.getPersonalizedTips = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const [userStats, platformAverages] = await Promise.all([
    analyticsService.getUserStats(userId),
    analyticsService.getPlatformAverages(),
  ]);

  const personalizedTips = [];

  if (userStats.totalOrders < platformAverages.avgOrders) {
    personalizedTips.push(getRandomTip(tipCategories.ORDERING));
  }

  if (userStats.totalSpent < platformAverages.avgSpent) {
    personalizedTips.push(getRandomTip(tipCategories.SPENDING));
  }

  if (
    userStats.sustainabilityImpact.totalCO2Saved <
      platformAverages.avgSustainabilityImpact.avgCO2Saved ||
    userStats.sustainabilityImpact.totalWaterSaved <
      platformAverages.avgSustainabilityImpact.avgWaterSaved ||
    userStats.sustainabilityImpact.totalEnergyConserved <
      platformAverages.avgSustainabilityImpact.avgEnergyConserved
  ) {
    personalizedTips.push(getRandomTip(tipCategories.IMPACT));
  }

  if (userStats.completedGoals < platformAverages.avgCompletedGoals) {
    personalizedTips.push(getRandomTip(tipCategories.GOALS));
  }

  if (userStats.sustainabilityScore < platformAverages.avgSustainabilityScore) {
    personalizedTips.push(getRandomTip(tipCategories.SCORE));
  }

  // If user is above average in all categories, give a general tip
  if (personalizedTips.length === 0) {
    personalizedTips.push(getRandomTip(getRandomCategory()));
  }

  return personalizedTips;
};

function getRandomTip(category) {
  const categoryTips = tips[category];
  return categoryTips[Math.floor(Math.random() * categoryTips.length)];
}

function getRandomCategory() {
  const categories = Object.values(tipCategories);
  return categories[Math.floor(Math.random() * categories.length)];
}
