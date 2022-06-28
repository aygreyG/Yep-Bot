const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription(
      "🎶 Joins your voice channel and queues the given song if it can."
    )
    .addStringOption((option) =>
      option
        .setName("arg")
        .setDescription("Url or song name.")
        .setRequired(true)
    ),
  async execute(interaction, client, arg = undefined) {
    const musicBot = client.musicbots.getBot(interaction);

    if (musicBot) {
      if (interaction.commandName) {
        arg = interaction.options.getString("arg");
      }

      let embed;
      if (
        arg &&
        (arg.includes("www.youtube.com") || arg.includes("youtu.be"))
      ) {
        embed = await musicBot.playUrl(arg);
      } else if (arg) {
        embed = await musicBot.searchTrack(arg, true);
      } else {
        embed = new MessageEmbed()
          .setColor("RED")
          .setDescription("Please give a youtube link or song name.");
      }
      interaction.reply({
        embeds: [embed],
      });
    } else {
      interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor("RED")
            .setDescription("Please join a voice channel!"),
        ],
      });
    }
  },
};
