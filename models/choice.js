'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Choice extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Choice.hasMany(models.Vote, {
        foreignKey: "optionId",
        onDelete: "CASCADE",
      });

      Choice.belongsTo(models.Question, {
        foreignKey: "questionId",
      });
    }
    }
  Choice.init({
    instruction: DataTypes.STRING,
    choiceId: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Choice',
  });
  return Choice;
};