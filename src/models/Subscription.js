module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define("Subscription", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    status: {
      type: DataTypes.ENUM("active", "paused", "cancelled"),
      defaultValue: "active",
    },
    nextDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  return Subscription;
};
