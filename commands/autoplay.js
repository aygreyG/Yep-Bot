const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("autoplay")
    .setDescription("🔀 It enables/disables autoplay."),
  execute(interaction, client, arg = undefined) {
    const musicBot = client.musicbots.getBot(interaction);
    let embed;

    if (musicBot) {
      embed = musicBot.autoPlay();
    } else {
      embed = new MessageEmbed()
        .setColor("RED")
        .setDescription("There is no bot in a voice channel!");
    }

    interaction.reply({ embeds: [embed] });
  },
};
