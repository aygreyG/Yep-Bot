const { Sequelize } = require("sequelize");
const path = require("path");

const sequelize = new Sequelize("database", "username", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: `${path.dirname(process.argv[1])}/data/database.sqlite`,
});

const Users = require("./schemas/User")(sequelize, Sequelize.DataTypes);
const Coins = require("./schemas/Coins")(sequelize, Sequelize.DataTypes);

module.exports = { Users, Coins };
