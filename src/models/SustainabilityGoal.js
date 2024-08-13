module.exports = (sequelize, DataTypes) => {
  const SustainabilityGoal = sequelize.define("SustainabilityGoal", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    targetValue: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    currentValue: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM(
        "energy",
        "water",
        "waste",
        "transportation",
        "consumption",
        "other"
      ),
      allowNull: false,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("in_progress", "completed", "failed"),
      defaultValue: "in_progress",
    },
  });

  SustainabilityGoal.associate = (models) => {
    SustainabilityGoal.belongsTo(models.User);
  };

  return SustainabilityGoal;
};
