const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("⏏ Stops playback and leaves the channel."),
  execute(interaction, client) {
    let embed;
    if (client.musicbots.has(interaction.guildId)) {
      client.musicbots.get(interaction.guildId).leave();
      client.musicbots.delete(interaction.guildId);
      embed = new MessageEmbed()
        .setColor("DARK_GREEN")
        .setDescription("👍 Left.");
    } else {
      embed = new MessageEmbed()
        .setColor("RED")
        .setDescription("Not in this server!");
    }
    interaction.reply({ embeds: [embed] });
  },
};
