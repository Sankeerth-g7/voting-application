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
      Question.hasMany(models.Vote, {
        foreignKey: "questionId",
        onDelete: "CASCADE",
      });

      Question.hasMany(models.choice, {
        foreignKey: "questionId",
        onDelete: "CASCADE",
      });

      Question.belongsTo(models.Elections, {
        foreignKey: "electionId",
        onDelete: "CASCADE",
      });
    }

    // Get all questions of an election with choices from Choice model
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

    static async createQuestion({ title, desc, electionId }) {
      const question = await Question.create({
        title: title,
        desc: desc,
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
            msg: "Title cannot be null",
          },
          notEmpty: {
            msg: "Title cannot be empty",
          },
          islen: function (value) {
            if (value.length < 3 || value.length > 100) {
              throw new Error("Title must be between 3 and 100 characters");
            }
          },
        },
      },
      desc: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Description cannot be null",
          },
          notEmpty: {
            msg: "Description cannot be empty",
          },
          islen: function (value) {
            if (value.length < 3 || value.length > 500) {
              throw new Error(
                "Description must be between 3 and 500 characters"
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
