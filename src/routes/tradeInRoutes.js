const express = require("express");
const router = express.Router();
const tradeInController = require("../controllers/tradeInController");
const { requireAuth } = require("../middlewares/authMiddleware");

router.post("/", requireAuth, tradeInController.createTradeInRequest);
router.get("/user", requireAuth, tradeInController.getUserTradeIns);
router.put("/:id/status", requireAuth, tradeInController.updateTradeInStatus);

module.exports = router;
