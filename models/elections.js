"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Elections extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Elections.belongsTo(models.admin, {
        foreignKey: "userId",
      });

      Elections.hasMany(models.Question, {
        foreignKey: "electionId",
        onDelete: "CASCADE",
      });

      Elections.hasMany(models.Voters, {
        foreignKey: "electionId",
        onDelete: "CASCADE",
      });
    }

    static async createElection({ electionName, urlString, userId }) {
      const election = await Elections.create({
        electionName: electionName,
        urlString: urlString,
        userId: userId,
      });
      return election;
    }

    static async getElectionsofUser({ userId }) {
      return await this.findAll({
        where: {
          userId: userId,
          status: false,
        },
      });
    }
    static async isElectionLive({ electionId }) {
      let election = await this.findOne({
        where: {
          id: electionId,
        },
      });
      // console.log("Election is Live: ",election.status)
      if (election && election.status) {
        return {
          success: election.status,
          ended: election.ended,
          message: "Success",
        };
      } else if (election && !election.status) {
        return {
          success: election.status,
          ended: election.ended,
          message: " Please visit the site when the election assigned to you is Live Yet!!!",
        };
      } else {
        return {
          success: false,
          message: "Sorry the election Does Not Exist",
        };
      }
    }

    static async electionEnded({ electionId }) {
      if (electionId == null || electionId == undefined || electionId == "") {
        return {
          success: false,
          message: "Election Cannot beNot Found",
        };
      } else {
        const election = await this.findOne({
          where: {
            id: electionId,
          },
        });
        if (election) {
          if (election.ended) {
            return {
              success: true,
              message: "Election Ended",
            };
          } else {
            return {
              success: false,
              message: "Election Not Ended",
            };
          }
        } else {
          return {
            success: false,
            message: "Election Not Found",
          };
        }
      }
    }

    static async getLiveElectionsofUser({ userId }) {
      return await this.findAll({
        where: {
          userId: userId,
          status: true,
        },
      });
    }

    static async launchElection({ electionId, userId }) {
      let election = await this.findOne({
        where: {
          id: electionId,
          userId: userId,
        },
      });
      if (election) {
        await election.update({ status: true });
      }
    }

    static async endElection({ electionId, userId }) {
      let election = await this.findOne({
        where: {
          id: electionId,
          userId: userId,
        },
      });
      if (election) {
        await election.update({ status: false, ended: true });
      }
    }

    static async isElectionbelongstoUser({ electionId, userId }) {
      let election = await this.findOne({
        where: {
          id: electionId,
        },
        include: [
          {
            model: sequelize.models.admin,
            where: {
              id: userId,
            },
          },
        ],
      });
      if (election) {
        return {
          success: true,
          status: election.status,
          ended: election.ended,
        };
      } else {
        return {
          success: false,
          message: "Election does not belong to user",
        };
      }
    }

    static async getElection({ electionId }) {
      return await this.findOne({
        where: {
          id: electionId,
        },
      });
    }

    static async deleteElection({ electionId }) {
      return await this.destroy({
        where: {
          id: electionId,
        },
      });
    }
  }
  Elections.init(
    {
      electionName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Election name cannot be empty",
          },
          notEmpty: {
            msg: "Election name cannot be empty",
          },
          islen: function (val) {
            if (val.length < 5) {
              throw new Error(
                "Election name must be atleast 5 characters long"
              );
            }
          },
        },
      },
      // Can be used to generate a custom URL for the election and should be unique for each election
      urlString: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
        validate: {
          islen: function (val) {
            if (val != null && val.length > 0 && val.length < 5) {
              throw new Error(
                "Custom string must be atleast 5 characters long"
              );
            }
          },
          isUnique: async function (val) {
            if (val != null && val.length > 0) {
              let election = await Elections.findOne({
                where: {
                  urlString: val,
                },
              });
              if (election) {
                throw new Error(
                  "Provide a custoum string that does not exist "
                );
              }
            }
          },
        },
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      ended: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Elections",
    }
  );
  return Elections;
};
