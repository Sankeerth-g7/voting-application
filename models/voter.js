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
      Voters.hasMany(models.Selections, {
        foreignKey: "selectionId",
        onDelete: "CASCADE",
      });

      Voters.belongsTo(models.Elections, {
        foreignKey: "electionId",
        onDelete: "CASCADE",
      });
    }

    static async getAllVotersofElection({ electionId, userId }) {
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

    static async getElectionOfVoter({ selectionId, electionId }) {
      return await this.findOne({
        where: {
          id: selectionId,
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
      voterid,
      password,
      votername,
      firstname,
      lastname,
      electionId,
    }) {
      const voter = await Voters.create({
        voterid: voterid,
        password: password,
        votername: votername,
        firstname: firstname,
        lastname: lastname,
        electionId: electionId,
      });
      // console.log(voter)
      return voter;
    }

    static async remove(selectionId, electionId) {
      return this.destroy({
        where: {
          id: selectionId,
          electionId: electionId,
        },
      });
    }
  }
  Voters.init(
    {
      voterid: {
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
            if (value.length <= 3) {
              throw new Error("Voter ID must be atleast 3 characters long");
            }
          },
          isUnique: async function (value) {
            if (value == null) {
              throw new Error("Voter ID must be atleast 3 characters long");
            }
            const voter = await Voters.findOne({
              where: {
                voterid: value,
              },
            });
            if (voter) {
              throw new Error("Voter ID already exists please user another id");
            }
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Password cannot be null",
          },
          notEmpty: {
            msg: "Password cannot be empty",
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