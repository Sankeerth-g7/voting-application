"use strict";
const { Model } = require("sequelize");
// eslint-disable-next-line no-unused-vars
module.exports = (sequelize, DataTypes) => {
  class Vote extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Vote.belongsTo(models.Voters, {
        foreignKey: {
          name: "voterId",
          allowNull: false,
        },
        onDelete: "CASCADE",
      });

      Vote.belongsTo(models.Question, {
        foreignKey: "QId",
        onDelete: "CASCADE",
      });

      Vote.belongsTo(models.choice, {
        foreignKey: "choiceId",
        onDelete: "CASCADE",
      });
    }

    static async createVote({ voterId, QID, choiceId }) {
      if (voterId && QID && choiceId) {
        const vote = await Vote.create({
          voterId: voterId,
          QId: QID,
          choiceId: choiceId,
        });
        return vote;
      } else {
        return null;
      }
    }

    static async getVotesOfOption({ choiceId }) {
      if (choiceId) {
        const votes = await Vote.findAll({
          where: {
            choiceId: choiceId,
          },
        });
        return votes;
      } else {
        return null;
      }
    }

    static async hasVoted({ voterId, QID }) {
      if (voterId && QID) {
        const vote = await Vote.findOne({
          where: {
            voterId: voterId,
            QId: QID,
          },
        });
        if (vote) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  }
  Vote.init(
    {},
    {
      sequelize,
      modelName: "Vote",
    }
  );
  return Vote;
};
