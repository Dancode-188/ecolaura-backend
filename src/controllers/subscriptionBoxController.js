const { SubscriptionBox, Product } = require("../models");

exports.getAllSubscriptionBoxes = async (req, res) => {
  try {
    const subscriptionBoxes = await SubscriptionBox.findAll({
      include: [{ model: Product }],
    });
    res.json(subscriptionBoxes);
  } catch (error) {
    console.error("Error fetching subscription boxes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getSubscriptionBoxById = async (req, res) => {
  try {
    const subscriptionBox = await SubscriptionBox.findByPk(req.params.id, {
      include: [{ model: Product }],
    });
    if (!subscriptionBox) {
      return res.status(404).json({ message: "Subscription box not found" });
    }
    res.json(subscriptionBox);
  } catch (error) {
    console.error("Error fetching subscription box:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.createSubscriptionBox = async (req, res) => {
  try {
    const subscriptionBox = await SubscriptionBox.create(req.body);
    if (req.body.productIds) {
      await subscriptionBox.setProducts(req.body.productIds);
    }
    res.status(201).json(subscriptionBox);
  } catch (error) {
    console.error("Error creating subscription box:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
