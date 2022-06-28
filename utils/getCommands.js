const { readdirSync } = require("fs");
const { Collection } = require("discord.js");

module.exports = () => {
  const commands = new Collection();
  readdirSync("./commands/").forEach(file => {
    if (file.endsWith(".js")) {
      const command = require(`../commands/${file}`);
      commands.set(command.data.name, command);
    }
  });

  return commands;
};
