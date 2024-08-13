const { Order, Product, User } = require("../models");
const sustainabilityService = require("../services/sustainabilityService");
const notificationService = require("../services/notificationService");

exports.createOrder = async (req, res) => {
  try {
    const order = await Order.create({
      UserId: req.session.getUserId(),
      totalAmount: req.body.totalAmount,
      status: "pending",
    });
    await order.setProducts(req.body.productIds);
    await sustainabilityService.updateUserSustainabilityScore(
      req.session.getUserId()
    );
    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

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
