const { Sequelize } = require("sequelize");
const path = require("path");

module.exports = (force) => {
  const sequelize = new Sequelize("database", "username", "password", {
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    storage: `${path.dirname(process.argv[1])}/data/database.sqlite`,
  });

  require("./schemas/User")(sequelize, Sequelize.DataTypes);
  require("./schemas/Coins")(sequelize, Sequelize.DataTypes);

  sequelize
    .sync({ force })
    .then(async () => {
      console.log("Database synced");
      sequelize.close();
    })
    .catch(console.error);
};
