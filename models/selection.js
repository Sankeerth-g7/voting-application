"use strict";
const { Model } = require("sequelize");
// eslint-disable-next-line no-unused-vars
module.exports = (sequelize, DataTypes) => {
  class Selections extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Selections.belongsTo(models.Voters, {
        foreignKey: {
          name: "selectionId",
          allowNull: false,
        },
        onDelete: "CASCADE",
      });

      Selections.belongsTo(models.Question, {
        foreignKey: "questionId",
        onDelete: "CASCADE",
      });

      Selections.belongsTo(models.choices, {
        foreignKey: "choiceId",
        onDelete: "CASCADE",
      });
    }

    static async createSelection({ selectionId, questionId, choiceId }) {
      if (selectionId && questionId && choiceId) {
        const Selection = await Selection.create({
          selectionId: selectionId,
          questionId: questionId,
          choiceId: choiceId,
        });
        return Selection;
      } else {
        return null;
      }
    }

    static async getselctionsOfChoices({ choiceId }) {
      if (choiceId) {
        const Selections = await Selections.findAll({
          where: {
            choiceId: choiceId,
          },
        });
        return Selections;
      } else {
        return null;
      }
    }

    static async hasSelected({ selectionId, questionId }) {
      if (selectionId && questionId) {
        const Selection = await Selection.findOne({
          where: {
            selectionId: selectionId,
            questionId: questionId,
          },
        });
        if (Selection) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  }
  Selections.init(
    {},
    {
      sequelize,
      modelName: "Selections",
    }
  );
  return Selections;
};