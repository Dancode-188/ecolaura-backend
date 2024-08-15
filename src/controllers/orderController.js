const { Order, Product, User } = require("../models");
const notificationService = require("../services/notificationService");
const gamificationService = require("../services/gamificationService");
const paymentService = require("../services/paymentService");

exports.createOrder = async (req, res) => {
  try {
    const userId = req.session.getUserId();
    const { products, totalAmount } = req.body;

    // Create a payment intent
    const paymentIntent = await paymentService.createPaymentIntent(totalAmount);

    const order = await Order.create({
      UserId: userId,
      totalAmount,
      status: "pending",
      paymentIntentId: paymentIntent.id,
    });

    await order.setProducts(products);

    res.status(201).json({
      order,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.confirmOrder = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;
    const order = await Order.findByPk(orderId, {
      include: [{ model: Product }, { model: User }],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const paymentIntent = await paymentService.confirmPayment(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      order.status = "paid";
      await order.save();

      // Award points for the purchase
      const pointsEarned = Math.floor(order.totalAmount);
      await gamificationService.awardPoints(
        order.UserId,
        pointsEarned,
        "making a purchase"
      );

      // Check for new achievements
      await gamificationService.checkAchievements(order.UserId);

      // Update user's sustainability score based on purchased products
      await updateUserSustainabilityScore(order.UserId, order.Products);

      res.json({ message: "Payment confirmed and order updated" });
    } else {
      res.status(400).json({ message: "Payment failed" });
    }
  } catch (error) {
    console.error("Error confirming order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

async function updateUserSustainabilityScore(userId, products) {
  const user = await User.findByPk(userId);

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
