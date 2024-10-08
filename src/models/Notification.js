module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define("Notification", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "info",
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User);
  };

  return Notification;
};
