const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("🏓 Pings the bot, if it's available it will answer with the latency."),
  async execute(interaction) {
    const test = await interaction.channel.send({
      embeds: [new MessageEmbed().setDescription("Pinging...")],
    });
    test.delete();
    interaction.reply({
      embeds: [
        new MessageEmbed()
          .setColor("#D57A6F")
          .setDescription(
            `🏓 Pong, your latency is: ${
              test.createdTimestamp - interaction.createdTimestamp
            }ms.`
          ),
      ],
    });
  },
};
