module.exports = (sequelize, DataTypes) => {
  const SubscriptionBox = sequelize.define("SubscriptionBox", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    frequency: {
      type: DataTypes.ENUM("weekly", "biweekly", "monthly"),
      allowNull: false,
    },
  });

  return SubscriptionBox;
};
