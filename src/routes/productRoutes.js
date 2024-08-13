const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { requireAuth } = require("../middlewares/authMiddleware");

router.get("/search", productController.searchProducts);
router.get("/", productController.getAllProducts);
router.get(
  "/recommended",
  requireAuth,
  productController.getRecommendedProducts
);
router.get("/new-arrivals", productController.getNewArrivals);
router.get("/trending", productController.getTrendingProducts);
router.get("/:id", productController.getProductById);
router.post("/", requireAuth, productController.createProduct);
router.put("/:id", requireAuth, productController.updateProduct);

module.exports = router;
