const { MessageEmbed, TextChannel } = require("discord.js");
const { commands } = require("../constants/commandhelp");
const paginator = require("../utils/paginator");
const embedcolor = "#ADE9F2";
const { SlashCommandBuilder } = require("@discordjs/builders");

/**
 *
 * @param {TextChannel} channel
 * @param {string} arg
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription(
      "❓ Lists the commands and their descriptions or gives the description of the given command."
    )
    .addStringOption((option) =>
      option.setName("command").setDescription("A command.")
    ),
  async execute(interaction, client, arg = undefined) {
    if (interaction.commandName) {
      arg = interaction.options.getString("command");
    }

    if (arg == undefined || arg == null) {
      const fieldnames = [];
      const items = [];

      client.commands.forEach((cmd) => {
        fieldnames.push(cmd.data.name);
        items.push(cmd.data.description);
      });

      if (interaction.commandName) {
        interaction.deferReply();
        interaction.deleteReply();
      }

      paginator(
        interaction.channel,
        "__**Commands:**__",
        items,
        fieldnames,
        7,
        90000,
        embedcolor
      );
    } else {
      const com = client.commands.find((cmd) => {
        return cmd.data.name.includes(arg);
      });
      if (com) {
        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(embedcolor)
              .setDescription("__**Command and what it does**__")
              .addField(com.data.name, com.data.description),
          ],
        });
      } else {
        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor("RED")
              .setDescription("Couldn't find that command!"),
          ],
        });
      }
    }
  },
};
