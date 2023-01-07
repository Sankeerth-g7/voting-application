'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
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
      references: {
        table: "Questions",
        field: "id",
      },
    }),
    await queryInterface.addColumn("Selections", "optionId", {
      type: Sequelize.DataTypes.INTEGER,
    });

  await queryInterface.addConstraint("Selections", {
    fields: ["optionId"],
    type: "foreign key",
    name: "custom_fkey_optionId",
    references: {
      table: "Choices",
      field: "id",
    },
  });

  await queryInterface.addColumn("Selections", "voterId", {
    type: Sequelize.DataTypes.INTEGER,
  });

  await queryInterface.addConstraint("Selections", {
    fields: ["voterId"],
    type: "foreign key",
    name: "custom_fkey_voterId",
    references: {
      table: "Voters",
      field: "id",
    },
  });
},
  // eslint-disable-next-line no-unused-vars
  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("Voters", "electionId");
    await queryInterface.removeColumn("Election", "userId");
    await queryInterface.removeColumn("Questions", "electionId");
    await queryInterface.removeColumn("Choices", "questionId");
    await queryInterface.removeColumn("Selections", "questionId");
    await queryInterface.removeColumn("Choices", "optionId");
    await queryInterface.removeColumn("Choices", "voterId");
  }
};
