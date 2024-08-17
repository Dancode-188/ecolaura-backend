const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { requireAuth } = require("../middlewares/authMiddleware");

router.post("/", requireAuth, orderController.createOrder);
router.get("/user", requireAuth, orderController.getUserOrders);
router.post("/confirm", requireAuth, orderController.confirmOrder);
router.put("/:id/status", requireAuth, orderController.updateOrderStatus);

module.exports = router;
