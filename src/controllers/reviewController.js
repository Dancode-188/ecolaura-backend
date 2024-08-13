const { Review, User, Product } = require("../models");
const notificationService = require("../services/notificationService");

exports.createReview = async (req, res) => {
  try {
    const { productId, rating, title, content, sustainabilityRating } =
      req.body;
    const userId = req.session.getUserId();

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const review = await Review.create({
      UserId: userId,
      ProductId: productId,
      rating,
      title,
      content,
      sustainabilityRating,
    });

    // Update product's average rating and sustainability rating
    await updateProductRatings(productId);

    res.status(201).json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.findAll({
      where: { ProductId: productId },
      include: [
        {
          model: User,
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, content, sustainabilityRating } = req.body;
    const userId = req.session.getUserId();

    const [updatedRows] = await Review.update(
      { rating, title, content, sustainabilityRating },
      { where: { id, UserId: userId } }
    );

    if (updatedRows === 0) {
      return res
        .status(404)
        .json({ message: "Review not found or unauthorized" });
    }

    const updatedReview = await Review.findByPk(id);
    await updateProductRatings(updatedReview.ProductId);

    res.json(updatedReview);
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.getUserId();

    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.UserId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await review.destroy();
    await updateProductRatings(review.ProductId);

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

async function updateProductRatings(productId) {
  const reviews = await Review.findAll({
    where: { ProductId: productId },
  });

  if (reviews.length > 0) {
    const avgRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    const avgSustainabilityRating =
      reviews.reduce((sum, review) => sum + review.sustainabilityRating, 0) /
      reviews.length;

    await Product.update(
      {
        averageRating: Math.round(avgRating * 10) / 10,
        averageSustainabilityRating:
          Math.round(avgSustainabilityRating * 10) / 10,
      },
      { where: { id: productId } }
    );
  }
}
