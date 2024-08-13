const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { requireAdminAuth } = require("../middlewares/authMiddleware");

router.get("/dashboard", requireAdminAuth, adminController.getDashboardStats);
router.get("/users", requireAdminAuth, adminController.getUsers);
router.get("/products", requireAdminAuth, adminController.getProducts);
router.put("/products/:id", requireAdminAuth, adminController.updateProduct);

module.exports = router;
