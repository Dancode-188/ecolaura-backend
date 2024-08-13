module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define("Comment", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });

  Comment.associate = (models) => {
    Comment.belongsTo(models.User);
    Comment.belongsTo(models.SustainabilityPost);
  };

  return Comment;
};
