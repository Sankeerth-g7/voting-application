'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Election extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Election.belongsTo(models.ElectionAdmin, {
        foreignKey: "userId",
      });

      Election.hasMany(models.Question, {
        foreignKey: "electionId",
        onDelete: "CASCADE",
      });

      Election.hasMany(models.Voters, {
        foreignKey: "electionId",
        onDelete: "CASCADE",
      });
    }
    }
  Election.init({
    electionId: DataTypes.STRING,
    electionName: DataTypes.STRING,
    url: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Election',
  });
  return Election;
};