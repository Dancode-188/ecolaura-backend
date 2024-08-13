const { Op } = require("sequelize");
const { Product } = require("../models");

exports.searchProducts = async (query) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    minSustainabilityScore,
    tags,
    sortBy,
    page = 1,
    limit = 10,
  } = query;

  const whereClause = {};
  const order = [];

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (category) {
    whereClause.category = category;
  }

  if (minPrice || maxPrice) {
    whereClause.price = {};
    if (minPrice) whereClause.price[Op.gte] = minPrice;
    if (maxPrice) whereClause.price[Op.lte] = maxPrice;
  }

  if (minSustainabilityScore) {
    whereClause.sustainabilityScore = { [Op.gte]: minSustainabilityScore };
  }

  if (tags && tags.length > 0) {
    whereClause.tags = { [Op.overlap]: tags };
  }

  if (sortBy) {
    switch (sortBy) {
      case "price_asc":
        order.push(["price", "ASC"]);
        break;
      case "price_desc":
        order.push(["price", "DESC"]);
        break;
      case "sustainability_desc":
        order.push(["sustainabilityScore", "DESC"]);
        break;
      default:
        order.push(["createdAt", "DESC"]);
    }
  } else {
    order.push(["createdAt", "DESC"]);
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await Product.findAndCountAll({
    where: whereClause,
    order,
    limit,
    offset,
  });

  return {
    products: rows,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    totalProducts: count,
  };
};
