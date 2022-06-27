const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("repeat")
    .setDescription("🔂 Turns on and off repeat."),
  execute(interaction, client, arg = undefined) {
    const musicBot = client.musicbots.getBot(interaction);
    let embed;

    if (musicBot) {
      embed = musicBot.repeatChange();
    } else {
      embed = new MessageEmbed()
        .setColor("RED")
        .setDescription("There is no bot in a voice channel!");
    }

    interaction.reply({ embeds: [embed] });
  },
};
