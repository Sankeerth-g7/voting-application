"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Question.hasMany(models.Selections, {
        foreignKey: "questionId",
        onDelete: "CASCADE",
      });

      Question.hasMany(models.choices, {
        foreignKey: "questionId",
        onDelete: "CASCADE",
      });

      Question.belongsTo(models.Elections, {
        foreignKey: "electionId",
        onDelete: "CASCADE",
      });
    }

    static async getAllQuestionsofElection({ electionId, userId }) {
      const questions = await Question.findAll({
        where: {
          electionId,
        },
        include: [
          {
            model: sequelize.models.Elections,
            where: {
              userId: userId,
              id: electionId,
            },
          },
        ],
      });
      return questions;
    }

    static async getQuesionsOfElection({ electionId }) {
      const questions = await Question.findAll({
        where: {
          electionId: electionId,
        },
      });
      return questions;
    }

    static async deleteQuestion({ questionId, electionId }) {
      return await Question.destroy({
        where: {
          id: questionId,
          electionId: electionId,
        },
      });
    }

    static async createQuestion({ title, info, electionId }) {
      const question = await Question.create({
        title: title,
        info: info,
        electionId: electionId,
      });
      return question;
    }
  }
  Question.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Question title cannot be null",
          },
          notEmpty: {
            msg: "Question title cannot be empty",
          },
          islen: function (value) {
            if (value.length < 3 || value.length > 100) {
              throw new Error("Title length must be between 3 and 100 characters");
            }
          },
        },
      },
      info: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "information cannot be null",
          },
          notEmpty: {
            msg: "information cannot be empty",
          },
          islen: function (value) {
            if (value.length < 3 || value.length > 500) {
              throw new Error(
                "information must be between 3 and 500 characters"
              );
            }
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Question",
    }
  );
  return Question;
};