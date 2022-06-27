const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("💰 Shows you your or the tagged user's balance.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user who's balance you would like to get.")
    ),
  async execute(interaction, client, arg = undefined) {
    let embed = new MessageEmbed().setColor("DARK_ORANGE");

    if (!interaction.commandName) {
      if (interaction.mentions.users.first()) {
        embed.setDescription(
          `${interaction.mentions.users.first()} has: ${await client.currency.getBalance(
            interaction.mentions.users.first().id
          )}`
        );
      } else {
        embed.setDescription(
          `${interaction.author}, you have: ${await client.currency.getBalance(
            interaction.author.id
          )}`
        );
      }
    } else {
      let user = interaction.options.getUser("user");

      if (user) {
        embed.setDescription(
          `${user} has ${await client.currency.getBalance(user.id)}.`
        );
      } else {
        embed.setDescription(
          `You have: ${await client.currency.getBalance(interaction.user.id)}`
        );
      }
    }

    interaction.reply({ embeds: [embed] });
  },
};
