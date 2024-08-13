const { Order, Product, User } = require("../models");
//const sustainabilityService = require("../services/sustainabilityService");
const notificationService = require("../services/notificationService");
const gamificationService = require("../services/gamificationService");

exports.createOrder = async (req, res) => {
  try {
    const userId = req.session.getUserId();
    const { products, totalAmount } = req.body;

    const order = await Order.create({
      UserId: userId,
      totalAmount,
      status: "pending",
    });

    await order.setProducts(products);

    // Award points for the purchase
    const pointsEarned = Math.floor(totalAmount);
    await gamificationService.awardPoints(
      userId,
      pointsEarned,
      "making a purchase"
    );

    // Check for new achievements
    await gamificationService.checkAchievements(userId);

    // Update user's sustainability score based on purchased products
    await updateUserSustainabilityScore(userId, products);

    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

async function updateUserSustainabilityScore(userId, productIds) {
  const user = await User.findByPk(userId);
  const products = await Product.findAll({ where: { id: productIds } });

  const averageSustainabilityScore =
    products.reduce((sum, product) => sum + product.sustainabilityScore, 0) /
    products.length;

  // Update user's sustainability score (simple moving average)
  user.sustainabilityScore = Math.round(
    (user.sustainabilityScore + averageSustainabilityScore) / 2
  );
  await user.save();
}

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { UserId: req.session.getUserId() },
      include: [{ model: Product }],
    });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const [updatedRows] = await Order.update({ status }, { where: { id } });

    if (updatedRows === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const updatedOrder = await Order.findByPk(id, {
      include: [{ model: User }, { model: Product }],
    });

    if (status === "delivered") {
      // Send notification to user to review the products
      const productNames = updatedOrder.Products.map(
        (product) => product.name
      ).join(", ");
      await notificationService.sendNotification(
        updatedOrder.User.id,
        `Your order containing ${productNames} has been delivered. Don't forget to leave a review!`,
        "review_reminder"
      );
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
