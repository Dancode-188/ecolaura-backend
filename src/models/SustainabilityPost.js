module.exports = (sequelize, DataTypes) => {
  const SustainabilityPost = sequelize.define("SustainabilityPost", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("goal", "achievement"),
      allowNull: false,
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  });

  SustainabilityPost.associate = (models) => {
    SustainabilityPost.belongsTo(models.User);
    SustainabilityPost.hasMany(models.Comment);
  };

  return SustainabilityPost;
};
