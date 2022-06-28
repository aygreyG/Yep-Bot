const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bet")
    .setDescription("💵 Bet to a blackjack game.")
    .addIntegerOption((option) =>
      option
        .setRequired(true)
        .setName("amount")
        .setDescription("The amount you want to bet.")
    ),
  execute(interaction, client, arg = undefined) {
    if (!client.blackjackGames.has(interaction.guildId)) {
      interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor("RED")
            .setDescription(
              "There is no game in the server! You can start one with the blackjack command."
            ),
        ],
        ephemeral: true,
      });
      return;
    }

    let amount;
    if (!interaction.commandName && !parseInt(arg)) {
      interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor("RED")
            .setDescription("That is not a proper number!"),
        ],
        ephemeral: true,
      });
      return;
    }

    if (interaction.commandName) {
      amount = interaction.options.getInteger("amount");
    } else {
      amount = parseInt(arg);
    }

    const embed = client.blackjackGames
      .get(interaction.guildId)
      .playerBet(interaction, amount);

    interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
