'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Selection extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Selection.belongsTo(models.Voters, {
        foreignKey: "voterId",
      });

      Selection.hasOne(models.Question, {
        foreignKey: "questionId",
        onDelete: "CASCADE",
      });

      Selection.hasOne(models.Option, {
        foreignKey: "optionId",
        onDelete: "CASCADE",
      });
    }
  }
  Selection.init({
    SelectionId: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Selection',
  });
  return Selection;
};