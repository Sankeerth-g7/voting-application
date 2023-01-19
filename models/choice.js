"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class choice extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      choice.hasMany(models.Vote, {
        foreignKey: "choiceId",
        onDelete: "CASCADE",
      });

      choice.belongsTo(models.Question, {
        foreignKey: "questionId",
        onDelete: "CASCADE",
      });
    }

    static async getAllchoicesOfQuestion({ questionId }) {
      console.log(questionId);
      const choices = await choice.findAll({
        where: {
          questionId: questionId,
        },
      });
      console.log(choices);
      return choices
    }

    static async createchoice({ desc, questionId }) {
      console.log("desc: " + desc + " questionId: " + questionId);
      const option = await choice.create({
        desc: desc,
        questionId: questionId,
      });
      return option;
    }

    static async doesChoiceBelongToQuestion({ questionId, choiceId }) {
      // console.log(choiceId, questionId)
      return await choice.findOne({
        where: {
          questionId: questionId,
          id: choiceId,
        },
      });
    }
  }
  choice.init(
    {
      desc: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "description for choice cannot be null",
          },
          notEmpty: {
            msg: "description for choice cannot be empty",
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
      modelName: "choice",
    }
  );
  return choice;
};
