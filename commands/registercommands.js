const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { clientId, token } = require("../config.json");
const { readdirSync } = require("fs");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("registercommands")
    .setDescription("Registers slash commands to this server.")
    .setDefaultMemberPermissions(),
  async execute(interaction) {
    const commands = [];
    const files = readdirSync("./commands/").filter(
      (file) => file.includes(".js") && file !== "registercommands.js"
    );
    for (const file of files) {
      // console.log(file);
      const command = require(`./${file}`);
      if (command.data) {
        commands.push(command.data.toJSON());
      }
    }
    commands.push(this.data.toJSON());
    const rest = new REST({ version: "9" }).setToken(token);
    try {
      console.log("Started refreshing application (/) commands.");

      await rest.put(
        Routes.applicationGuildCommands(clientId, interaction.guild.id),
        { body: commands }
      );

      interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor("GREEN")
            .setDescription("Successfully registered slash commands!"),
        ],
      });
      console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
      console.error(error);
    }
  },
};
