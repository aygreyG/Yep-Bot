const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("current")
    .setDescription("🔘 Shows the currently playing song."),
  execute(interaction, client, arg = undefined) {
    const musicBot = client.musicbots.getBot(interaction);

    if (!musicBot) {
      interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor("RED")
            .setDescription("There is no bot in a voice channel!"),
        ],
      });
      return;
    }

    if (interaction.commandName) {
      interaction.deferReply();
      interaction.deleteReply();
    }

    musicBot.currentlyPlaying();
  },
};
