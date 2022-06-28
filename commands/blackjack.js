const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const BlackjackGame = require("../models/BlackjackGame");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("blackjack")
    .setDescription("🃏 Starts a new blackjack game."),
  execute(interaction, client, arg = undefined) {
    if (client.blackjackGames.has(interaction.guildId)) {
      interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor("RED")
            .setDescription("There is a game already in this server!"),
        ],
        ephemeral: true,
      });

      return;
    }

    if (interaction.commandName) {
      interaction.deferReply();
      interaction.deleteReply();
    }

    client.blackjackGames.set(
      interaction.guildId,
      new BlackjackGame(interaction, client)
    );
  },
};
