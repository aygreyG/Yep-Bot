const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription(
      "⏹ Stops playback, sets autoplay to off and clears the queue."
    ),
  execute(interaction, client) {
    let embed;
    if (client.musicbots.has(interaction.guildId)) {
      embed = client.musicbots.get(interaction.guildId).stop();
    } else {
      embed = new MessageEmbed()
        .setColor("RED")
        .setDescription("Not in this server!");
    }
    interaction.reply({ embeds: [embed] });
  },
};
