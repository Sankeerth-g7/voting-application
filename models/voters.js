"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Voters extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Voters.hasMany(models.Vote, {
        foreignKey: "voterId",
        onDelete: "CASCADE",
      });

      Voters.belongsTo(models.Elections, {
        foreignKey: "electionId",
        onDelete: "CASCADE",
      });
    }

    static async getAllVotersofElection({ electionId, userId}) {
      return await this.findAll({
        where: {
          electionId: electionId,
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
    }

    static async getElectionOfVoter({ voterId, electionId }) {
      return await this.findOne({
        where: {
          id: voterId,
        },
        include: [
          {
            model: sequelize.models.Elections,
            where: {
              id: electionId,
            },
          },
        ],
      });
    }

    static async createVoter({
      voterId,
      password,
      votername,
      electionId,
    }) {
      const voter = await Voters.create({
        voterId: voterId,
        password: password,
        votername: votername,
        electionId: electionId,
      });
      // console.log(voter)
      return voter;
    }

    static async remove(voterId, electionId) {
      return this.destroy({
        where: {
          id: voterId,
          electionId: electionId,
        },
      });
    }
  }
  Voters.init(
    {
      voterId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notNull: {
            msg: "Voter ID cannot be null",
          },
          notEmpty: {
            msg: "Voter ID cannot be empty",
          },
          islen: function (value) {
            if (value.length < 2) {
              throw new Error("Please provide a valid Voter ID with atleast 2 characters");
            }
          },
          isUnique: async function (value) {
            if (value == null) {
              throw new Error("Voter ID must be atleast 2 characters long");
            }
            const voter = await Voters.findOne({
              where: {
                voterId: value,
              },
            });
            if (voter) {
              throw new Error("The Voter ID is already in use");
            }
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Please provide a password",
          },
          notEmpty: {
            msg: "Password Cannot be Empty",
          },
        },
      },
      votername: DataTypes.STRING,
      firstname: DataTypes.STRING,
      lastname: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Voters",
    }
  );
  return Voters;
};