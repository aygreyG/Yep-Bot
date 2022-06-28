const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const paginator = require("../utils/paginator");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("📋 Shows you the leaderboard."),
  async execute(interaction, client) {
    const members = (await interaction.guild.members.fetch()).map(
      (member) => member.id
    );
    const items = [];

    client.currency
      .filter(
        (user) =>
          client.users.cache.has(user.user_id) && members.includes(user.user_id)
      )
      .sort((a, b) => b.balance - a.balance)
      .map((user) => {
        items.push(
          `**${client.users.cache.get(user.user_id).username}:** \`${user.balance}\``
        );
      });

    if (items.length > 0) {
      if (interaction.commandName) {
        interaction.deferReply();
        interaction.deleteReply();
      }

      paginator(
        interaction.channel,
        "__**Leaderboard**__",
        items,
        undefined,
        10,
        undefined,
        "#dbaa23",
        false
      );
    } else
      interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor("RED")
            .setDescription("There is no data for this server."),
        ],
      });
  },
};
