const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("database", "username", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: "database.sqlite",
});

const Users = require("./models/User")(sequelize, Sequelize.DataTypes);
const Coins = require("./models/Coins")(sequelize, Sequelize.DataTypes);

module.exports = { Users, Coins };
