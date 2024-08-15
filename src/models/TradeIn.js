module.exports = (sequelize, DataTypes) => {
  const TradeIn = sequelize.define("TradeIn", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    condition: {
      type: DataTypes.ENUM("like_new", "good", "fair", "poor"),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    estimatedValue: {
      type: DataTypes.DECIMAL(10, 2),
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected", "completed"),
      defaultValue: "pending",
    },
  });

  TradeIn.associate = (models) => {
    TradeIn.belongsTo(models.User);
  };

  return TradeIn;
};
