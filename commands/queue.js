const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("📃 Shows you the queue."),
  execute(interaction, client) {
    let embed;
    if (client.musicbots.has(interaction.guildId)) {
      embed = client.musicbots.get(interaction.guildId).queuePrint();
      if (interaction.commandName && !embed) {
        interaction.deferReply();
        interaction.deleteReply();
        return;
      }
    } else {
      embed = new MessageEmbed()
        .setColor("RED")
        .setDescription("Not in this server!");
    }
    interaction.reply({ embeds: [embed] });
  },
};
