const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { requireAuth } = require("../middlewares/authMiddleware");

router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.post("/", requireAuth, productController.createProduct);
router.put("/:id", requireAuth, productController.updateProduct);

module.exports = router;
