const { Order, Product } = require("../models");
const sustainabilityService = require("../services/sustainabilityService");

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
