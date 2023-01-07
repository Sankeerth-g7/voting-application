"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn("Voters", "electionId", {
      type: Sequelize.DataTypes.INTEGER,
    }),
      await queryInterface.addConstraint("Voters", {
        fields: ["electionId"],
        type: "foreign key",
        name: "custom_fkey_electionId",
        onDelete: "CASCADE",
        references: {
          table: "Elections",
          field: "id",
        },
      }),
      await queryInterface.addColumn("Elections", "userId", {
        type: Sequelize.DataTypes.INTEGER,
      });

    await queryInterface.addConstraint("Elections", {
      fields: ["userId"],
      type: "foreign key",
      name: "custom_fkey_userId",
      onDelete: "CASCADE",
      references: {
        table: "Admins",
        field: "id",
      },
    }),
      await queryInterface.addColumn("Questions", "electionId", {
        type: Sequelize.DataTypes.INTEGER,
      }),
      await queryInterface.addConstraint("Questions", {
        fields: ["electionId"],
        type: "foreign key",
        name: "custom_fkey_electionId",
        onDelete: "CASCADE",
        references: {
          table: "Elections",
          field: "id",
        },
      }),
      await queryInterface.addColumn("Choices", "questionId", {
        type: Sequelize.DataTypes.INTEGER,
      }),
      await queryInterface.addConstraint("Choices", {
        fields: ["questionId"],
        type: "foreign key",
        name: "custom_fkey_questionId",
        onDelete: "CASCADE",
        references: {
          table: "Questions",
          field: "id",
        },
      }),
      await queryInterface.addColumn("Selections", "questionId", {
        type: Sequelize.DataTypes.INTEGER,
      }),
      await queryInterface.addConstraint("Selections", {
        fields: ["questionId"],
        type: "foreign key",
        name: "custom_fkey_questionId",
        onDelete: "CASCADE",
        references: {
          table: "Questions",
          field: "id",
        },
      }),
      await queryInterface.addColumn("Selections", "choiceId", {
        type: Sequelize.DataTypes.INTEGER,
      });

    await queryInterface.addConstraint("Selections", {
      fields: ["choiceId"],
      type: "foreign key",
      name: "custom_fkey_optionId",
      onDelete: "CASCADE",
      references: {
        table: "Choices",
        field: "id",
      },
    });

    await queryInterface.addColumn("Selections", "slectionId", {
      type: Sequelize.DataTypes.INTEGER,
    });

    await queryInterface.addConstraint("Selections", {
      fields: ["slectionId"],
      type: "foreign key",
      name: "custom_fkey_voterId",
      onDelete: "CASCADE",
      references: {
        table: "Voters",
        field: "id",
      },
    });
  },

  // eslint-disable-next-line no-unused-vars
  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("voters", "electionId");
    await queryInterface.removeColumn("Elections", "userId");
    await queryInterface.removeColumn("Questions", "electionId");
    await queryInterface.removeColumn("Choices", "questionId");
    await queryInterface.removeColumn("Selections", "questionId");
    await queryInterface.removeColumn("Selections", "choiceId");
    await queryInterface.removeColumn("Selections", "slectionId");
  },
};