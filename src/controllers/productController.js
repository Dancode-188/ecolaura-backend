const { Product } = require("../models");
const sustainabilityService = require("../services/sustainabilityService");
const searchService = require("../services/searchService");
const recommendationService = require("../services/recommendationService");
const blockchainService = require("../services/blockchainService");

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

    // Add product creation event to blockchain
    await blockchainService.addProductEvent(product.id, "Product Created");

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

    // Add product update event to blockchain
    await blockchainService.addProductEvent(req.params.id, "Product Updated");

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

exports.getSimilarProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const similarProducts = await recommendationService.getSimilarProducts(
      productId
    );
    res.json(similarProducts);
  } catch (error) {
    console.error("Error fetching similar products:", error);
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

exports.getProductHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await blockchainService.getProductHistory(id);
    res.json(history);
  } catch (error) {
    console.error("Error fetching product history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};