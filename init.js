const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("database", "username", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: "database.sqlite",
});

require("./models/User")(sequelize, Sequelize.DataTypes);
require("./models/Coins")(sequelize, Sequelize.DataTypes);

const force = process.argv.includes("--force") || process.argv.includes("-f");

sequelize
  .sync({ force })
  .then(async () => {
    console.log("Database synced");
    sequelize.close();
  })
  .catch(console.error);

try {
  const { prefix, token } = require("./config.json");
} catch (err) {
  const fs = require("fs");
  try {
    fs.writeFile(
      "./config.json",
      '{\n\t"prefix": "your-prefix",\n\t"token": "your-token",\n\t"minecraftIp": "your-ip(optional)",\n\t"minecraftPort": "your-port(optional)",\n\t"progressEmote": "🔘"\n}',
      "utf-8",
      () => {
        console.log(
          "Config.json created successfully. PLEASE UPDATE CONFIG.JSON BEFORE STARTING THE BOT!"
        );
      }
    );
    fs.writeFile("./coins.json", '{"tails":0,"heads":0}', "utf8", () =>
      console.log("New coins.json created.")
    );
  } catch (e) {
    console.error(e);
  }
}
