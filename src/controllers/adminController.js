const {
  Admin,
  User,
  Product,
  Order,
  SustainabilityPost,
} = require("../models");
const { Op } = require("sequelize");

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalProducts = await Product.count();
    const totalOrders = await Order.count();
    const totalRevenue = await Order.sum("totalAmount");
    const totalSustainabilityPosts = await SustainabilityPost.count();

    const newUsersThisMonth = await User.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const topSustainableProducts = await Product.findAll({
      order: [["sustainabilityScore", "DESC"]],
      limit: 5,
    });

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      totalSustainabilityPosts,
      newUsersThisMonth,
      topSustainableProducts,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "sustainabilityScore", "createdAt"],
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const [updatedRows] = await Product.update(req.body, { where: { id } });
    if (updatedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product updated successfully" });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add more admin-specific methods as needed
