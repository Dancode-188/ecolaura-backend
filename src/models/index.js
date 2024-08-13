const { Sequelize } = require("sequelize");
const { sequelize } = require("../config/database");

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require("./User")(sequelize, Sequelize);
db.Product = require("./Product")(sequelize, Sequelize);
db.Order = require("./Order")(sequelize, Sequelize);
db.SubscriptionBox = require("./SubscriptionBox")(sequelize, Sequelize);
db.Subscription = require("./Subscription")(sequelize, Sequelize);
db.Notification = require("./Notification")(sequelize, Sequelize);
db.SustainabilityPost = require("./SustainabilityPost")(sequelize, Sequelize);
db.Comment = require("./Comment")(sequelize, Sequelize);
db.Review = require("./Review")(sequelize, Sequelize);
db.Achievement = require("./Achievement")(sequelize, Sequelize);

// Define associations
db.User.hasMany(db.Review);
db.Review.belongsTo(db.User);

db.Product.hasMany(db.Review);
db.Review.belongsTo(db.Product);

db.User.hasMany(db.SustainabilityPost);
db.SustainabilityPost.belongsTo(db.User);

db.User.hasMany(db.Comment);
db.Comment.belongsTo(db.User);

db.SustainabilityPost.hasMany(db.Comment);
db.Comment.belongsTo(db.SustainabilityPost);

db.User.hasMany(db.Order);
db.Order.belongsTo(db.User);

db.User.hasMany(db.Notification);
db.Notification.belongsTo(db.User);

db.User.hasMany(db.Subscription);
db.Subscription.belongsTo(db.User);

db.SubscriptionBox.hasMany(db.Subscription);
db.Subscription.belongsTo(db.SubscriptionBox);

db.SubscriptionBox.belongsToMany(db.Product, {
  through: "SubscriptionBoxProduct",
});
db.Product.belongsToMany(db.SubscriptionBox, {
  through: "SubscriptionBoxProduct",
});

db.Order.belongsToMany(db.Product, { through: "OrderProduct" });
db.Product.belongsToMany(db.Order, { through: "OrderProduct" });

module.exports = db;
