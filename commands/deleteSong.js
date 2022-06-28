const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("delete")
    .setDescription("💥 Deletes the song from the queue.")
    .addStringOption((option) =>
      option
        .setName("phrase")
        .setDescription(
          "A phrase or index to identify the song you want to delete."
        )
        .setRequired(true)
    ),
  execute(interaction, client, arg = undefined) {
    let embed;
    if (client.musicbots.has(interaction.guildId)) {
      if (interaction.commandName) {
        arg = interaction.options.getString("phrase");
      }
      embed = client.musicbots.get(interaction.guildId).deleteFromQueue(arg);
    } else {
      embed = new MessageEmbed()
        .setColor("RED")
        .setDescription("Not in this server!");
    }
    interaction.reply({ embeds: [embed] });
  },
};
