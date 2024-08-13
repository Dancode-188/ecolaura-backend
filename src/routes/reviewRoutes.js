const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { requireAuth } = require("../middlewares/authMiddleware");

router.post("/", requireAuth, reviewController.createReview);
router.get("/product/:productId", reviewController.getProductReviews);
router.put("/:id", requireAuth, reviewController.updateReview);
router.delete("/:id", requireAuth, reviewController.deleteReview);

module.exports = router;
