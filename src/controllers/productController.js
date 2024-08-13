const { Product } = require("../models");
const sustainabilityService = require("../services/sustainabilityService");

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const productData = req.body;
    productData.sustainabilityScore =
      sustainabilityService.calculateProductSustainabilityScore(productData);
    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const productData = req.body;
    productData.sustainabilityScore =
      sustainabilityService.calculateProductSustainabilityScore(productData);
    const [updatedRows] = await Product.update(productData, {
      where: { id: req.params.id },
    });
    if (updatedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product updated successfully" });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
