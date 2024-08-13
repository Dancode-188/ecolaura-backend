const { Product } = require("../models");
const sustainabilityService = require("../services/sustainabilityService");
const searchService = require("../services/searchService");
const recommendationService = require("../services/recommendationService");

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
    productData.minSustainabilityScore = Math.floor(
      productData.sustainabilityScore * 0.9
    ); // 90% of the actual score
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
    productData.minSustainabilityScore = Math.floor(
      productData.sustainabilityScore * 0.9
    ); // 90% of the actual score
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

exports.searchProducts = async (req, res) => {
  try {
    const result = await searchService.searchProducts(req.query);
    res.json(result);
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getRecommendedProducts = async (req, res) => {
  try {
    const userId = req.session.getUserId();
    const recommendedProducts =
      await recommendationService.getRecommendedProducts(userId);
    res.json(recommendedProducts);
  } catch (error) {
    console.error("Error fetching recommended products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getNewArrivals = async (req, res) => {
  try {
    const newArrivals = await recommendationService.getNewArrivals();
    res.json(newArrivals);
  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getTrendingProducts = async (req, res) => {
  try {
    const trendingProducts = await recommendationService.getTrendingProducts();
    res.json(trendingProducts);
  } catch (error) {
    console.error("Error fetching trending products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};