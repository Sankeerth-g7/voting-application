"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class choices extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      choices.hasMany(models.Selections, {
        foreignKey: "chioiceId",
        onDelete: "CASCADE",
      });

      choices.belongsTo(models.Question, {
        foreignKey: "questionId",
        onDelete: "CASCADE",
      });
    }

    static async getAllChoicesOfQuestion({ questionId }) {
      const choices = await choices.findAll({
        where: {
          questionId: questionId,
        },
      });
      return choices;
    }

    static async createChoies({ desc, questionId }) {
      // console.log("desc: " + desc + " questionId: " + questionId);
      const choices = await choices.create({
        desc: desc,
        questionId: questionId,
      });
      return choices;
    }

    static async doesChoiceBelongToQuestion({ questionId, choiceId }) {
      // console.log("questionId: " + questionId + " choiceId: " + choiceId);
      return await choices.findOne({
        where: {
          questionId: questionId,
          id: choiceId,
        },
      });
    }
  }
  choices.init(
    {
      desc: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "choice description cannot be null",
          },
          notEmpty: {
            msg: "choice description cannot be empty",
          },
          islen: function (value) {
            if (value.length < 3 || value.length > 255) {
              throw new Error(
                "choice description must be between 3 and 255 characters long"
              );
            }
          },
        },
      },
    },
    {
      sequelize,
      modelName: "choices",
    }
  );
  return choices;
};