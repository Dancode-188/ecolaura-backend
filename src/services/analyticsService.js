const {
  User,
  Order,
  Product,
  SustainabilityGoal,
  Review,
} = require("../models");
const { Op, Sequelize } = require("sequelize");

exports.getUserAnalytics = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const today = new Date();
  const oneMonthAgo = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    today.getDate()
  );
  const sixMonthsAgo = new Date(
    today.getFullYear(),
    today.getMonth() - 6,
    today.getDate()
  );

  const [
    totalOrders,
    totalSpent,
    avgOrderValue,
    sustainabilityImpact,
    goalProgress,
    productCategories,
  ] = await Promise.all([
    Order.count({ where: { UserId: userId } }),
    Order.sum("totalAmount", { where: { UserId: userId } }),
    Order.findOne({
      where: { UserId: userId },
      attributes: [
        [Sequelize.fn("AVG", Sequelize.col("totalAmount")), "avgOrderValue"],
      ],
      raw: true,
    }),
    this.calculateSustainabilityImpact(userId),
    this.getGoalProgress(userId),
    this.getProductCategoryBreakdown(userId),
  ]);

  const monthlySpending = await this.getMonthlySpending(userId, sixMonthsAgo);
  const recentActivity = await this.getRecentActivity(userId, oneMonthAgo);

  return {
    totalOrders,
    totalSpent,
    avgOrderValue: avgOrderValue ? avgOrderValue.avgOrderValue : 0,
    sustainabilityImpact,
    goalProgress,
    productCategories,
    monthlySpending,
    recentActivity,
  };
};

exports.calculateSustainabilityImpact = async (userId) => {
  const orders = await Order.findAll({
    where: { UserId: userId },
    include: [{ model: Product, attributes: ["sustainabilityScore"] }],
  });

  let totalCO2Saved = 0;
  let totalWaterSaved = 0;
  let totalEnergyConserved = 0;

  orders.forEach((order) => {
    order.Products.forEach((product) => {
      // These calculations are hypothetical and should be adjusted based on real data
      totalCO2Saved += product.sustainabilityScore * 0.1; // kg of CO2
      totalWaterSaved += product.sustainabilityScore * 2; // liters
      totalEnergyConserved += product.sustainabilityScore * 0.5; // kWh
    });
  });

  return {
    totalCO2Saved: Math.round(totalCO2Saved * 10) / 10,
    totalWaterSaved: Math.round(totalWaterSaved),
    totalEnergyConserved: Math.round(totalEnergyConserved * 10) / 10,
  };
};

exports.getGoalProgress = async (userId) => {
  const goals = await SustainabilityGoal.findAll({
    where: { UserId: userId },
    attributes: ["id", "title", "targetValue", "currentValue", "status"],
  });

  return goals.map((goal) => ({
    ...goal.toJSON(),
    progressPercentage: Math.min(
      (goal.currentValue / goal.targetValue) * 100,
      100
    ),
  }));
};

exports.getProductCategoryBreakdown = async (userId) => {
  const categoryBreakdown = await Order.findAll({
    where: { UserId: userId },
    include: [{ model: Product, attributes: ["category"] }],
    attributes: [
      [Sequelize.fn("COUNT", Sequelize.col("Products.id")), "count"],
    ],
    group: ["Products.category"],
    raw: true,
  });

  return categoryBreakdown.map((item) => ({
    category: item["Products.category"],
    count: parseInt(item.count),
  }));
};

exports.getMonthlySpending = async (userId, startDate) => {
  const monthlySpending = await Order.findAll({
    where: {
      UserId: userId,
      createdAt: { [Op.gte]: startDate },
    },
    attributes: [
      [
        Sequelize.fn("date_trunc", "month", Sequelize.col("createdAt")),
        "month",
      ],
      [Sequelize.fn("SUM", Sequelize.col("totalAmount")), "total"],
    ],
    group: [Sequelize.fn("date_trunc", "month", Sequelize.col("createdAt"))],
    order: [
      [Sequelize.fn("date_trunc", "month", Sequelize.col("createdAt")), "ASC"],
    ],
    raw: true,
  });

  return monthlySpending.map((item) => ({
    month: item.month,
    total: parseFloat(item.total),
  }));
};

exports.getRecentActivity = async (userId, startDate) => {
  const [orders, reviews, goals] = await Promise.all([
    Order.findAll({
      where: { UserId: userId, createdAt: { [Op.gte]: startDate } },
      attributes: ["id", "totalAmount", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit: 5,
    }),
    Review.findAll({
      where: { UserId: userId, createdAt: { [Op.gte]: startDate } },
      attributes: ["id", "ProductId", "rating", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit: 5,
    }),
    SustainabilityGoal.findAll({
      where: { UserId: userId, createdAt: { [Op.gte]: startDate } },
      attributes: ["id", "title", "status", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit: 5,
    }),
  ]);

  const activity = [...orders, ...reviews, ...goals]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 10);

  return activity.map((item) => {
    if (item instanceof Order) {
      return {
        type: "order",
        id: item.id,
        amount: item.totalAmount,
        date: item.createdAt,
      };
    } else if (item instanceof Review) {
      return {
        type: "review",
        id: item.id,
        productId: item.ProductId,
        rating: item.rating,
        date: item.createdAt,
      };
    } else {
      return {
        type: "goal",
        id: item.id,
        title: item.title,
        status: item.status,
        date: item.createdAt,
      };
    }
  });
};

exports.getComparativeAnalytics = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const [userStats, platformAverages, userRank] = await Promise.all([
    this.getUserStats(userId),
    this.getPlatformAverages(),
    this.getUserSustainabilityRank(userId),
  ]);

  return {
    userStats,
    platformAverages,
    userRank,
  };
};

exports.getUserStats = async (userId) => {
  const [totalOrders, totalSpent, sustainabilityImpact, completedGoals] =
    await Promise.all([
      Order.count({ where: { UserId: userId } }),
      Order.sum("totalAmount", { where: { UserId: userId } }),
      this.calculateSustainabilityImpact(userId),
      SustainabilityGoal.count({
        where: { UserId: userId, status: "completed" },
      }),
    ]);

  const user = await User.findByPk(userId);

  return {
    totalOrders,
    totalSpent: totalSpent || 0,
    sustainabilityImpact,
    completedGoals,
    sustainabilityScore: user.sustainabilityScore,
  };
};

exports.getPlatformAverages = async () => {
  const totalUsers = await User.count();
  const [avgOrders, avgSpent, avgCompletedGoals, avgSustainabilityScore] =
    await Promise.all([
      Order.count() / totalUsers,
      Order.sum("totalAmount") / totalUsers,
      SustainabilityGoal.count({ where: { status: "completed" } }) / totalUsers,
      User.sum("sustainabilityScore") / totalUsers,
    ]);

  const avgSustainabilityImpact = await this.getAverageSustainabilityImpact();

  return {
    avgOrders: Math.round(avgOrders * 10) / 10,
    avgSpent: Math.round(avgSpent * 100) / 100,
    avgSustainabilityImpact,
    avgCompletedGoals: Math.round(avgCompletedGoals * 10) / 10,
    avgSustainabilityScore: Math.round(avgSustainabilityScore * 10) / 10,
  };
};

exports.getAverageSustainabilityImpact = async () => {
  const totalUsers = await User.count();
  const totalImpact = await Order.findAll({
    include: [{ model: Product, attributes: ["sustainabilityScore"] }],
    attributes: [
      [
        Sequelize.fn("SUM", Sequelize.col("Products.sustainabilityScore")),
        "totalScore",
      ],
    ],
    raw: true,
  });

  const avgScore = totalImpact[0].totalScore / totalUsers;

  return {
    avgCO2Saved: Math.round(avgScore * 0.1 * 10) / 10,
    avgWaterSaved: Math.round(avgScore * 2),
    avgEnergyConserved: Math.round(avgScore * 0.5 * 10) / 10,
  };
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