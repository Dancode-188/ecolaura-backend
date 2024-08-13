module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sustainabilityScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    fcmToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sustainabilityPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    // Store achievements as a JSON array
    achievements: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
  });

  return User;
};
