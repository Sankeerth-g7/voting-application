"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Admin extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Admin.hasMany(models.Elections, {
        foreignKey: "userId",
        onDelete: "CASCADE",
      });
    }
  }
  Admin.init(
    {
      firstname: {
        type: DataTypes.STRING,
        validate: {
          islen: function (value) {
            if (value.length > 1 && value.length < 3) {
              throw new Error("First name must be at least 2 characters long");
            }
          },
        },
      },
      lastname: {
        type: DataTypes.STRING,
      },
      email: {
        unique: true,
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Email is required",
          },
          notEmpty: {
            msg: "Email is required",
          },
          isEmail: {
            msg: "Email is invalid",
          },
          unique: function (value) {
            return Admin.findOne({ where: { email: value } }).then(
              (admin) => {
                if (admin) {
                  throw new Error("Email already in use");
                }
              }
            );
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        validate: {
          islen: function (value) {
            if (value.length > 1 && value.length <= 5) {
              throw new Error("Username must be at least 5 characters long");
            }
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Admin",
    }
  );
  return Admin;
};