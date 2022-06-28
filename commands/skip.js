const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription(
      "⏭ Skips the currently playing song, if autoplay is enabled, plays a related song."
    ),
  execute(interaction, client) {
    let embed;
    if (client.musicbots.has(interaction.guildId)) {
      embed = client.musicbots.get(interaction.guildId).skipMusic();
    } else {
      embed = new MessageEmbed()
        .setColor("RED")
        .setDescription("Not in this server!");
    }
    interaction.reply({ embeds: [embed] });
  },
};
