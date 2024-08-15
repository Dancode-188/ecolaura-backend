const { TradeIn, User } = require("../models");
const notificationService = require("../services/notificationService");
const gamificationService = require("../services/gamificationService");

exports.createTradeInRequest = async (req, res) => {
  try {
    const userId = req.session.getUserId();
    const { productName, condition, description } = req.body;

    const tradeIn = await TradeIn.create({
      UserId: userId,
      productName,
      condition,
      description,
    });

    await notificationService.sendNotification(
      userId,
      `Your trade-in request for ${productName} has been submitted and is pending review.`,
      "trade_in_submitted"
    );

    res.status(201).json(tradeIn);
  } catch (error) {
    console.error("Error creating trade-in request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getUserTradeIns = async (req, res) => {
  try {
    const userId = req.session.getUserId();
    const tradeIns = await TradeIn.findAll({ where: { UserId: userId } });
    res.json(tradeIns);
  } catch (error) {
    console.error("Error fetching user trade-ins:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateTradeInStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, estimatedValue } = req.body;

    const tradeIn = await TradeIn.findByPk(id, { include: User });
    if (!tradeIn) {
      return res.status(404).json({ message: "Trade-in request not found" });
    }

    await tradeIn.update({ status, estimatedValue });

    if (status === "approved") {
      await notificationService.sendNotification(
        tradeIn.User.id,
        `Your trade-in request for ${tradeIn.productName} has been approved with an estimated value of $${estimatedValue}.`,
        "trade_in_approved"
      );

      // Award sustainability points for successful trade-in
      await gamificationService.awardPoints(
        tradeIn.User.id,
        50,
        "successful trade-in"
      );
    } else if (status === "completed") {
      await notificationService.sendNotification(
        tradeIn.User.id,
        `Your trade-in for ${tradeIn.productName} has been completed. Your account has been credited with $${estimatedValue}.`,
        "trade_in_completed"
      );
    }

    res.json(tradeIn);
  } catch (error) {
    console.error("Error updating trade-in status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
