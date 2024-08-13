const { Sequelize } = require("sequelize");
const { sequelize } = require("../config/database");

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require("./User")(sequelize, Sequelize);
db.Product = require("./Product")(sequelize, Sequelize);
db.Order = require("./Order")(sequelize, Sequelize);

// Define associations
db.User.hasMany(db.Order);
db.Order.belongsTo(db.User);

db.Order.belongsToMany(db.Product, { through: "OrderProduct" });
db.Product.belongsToMany(db.Order, { through: "OrderProduct" });

module.exports = db;
