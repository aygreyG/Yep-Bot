const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playlist")
    .setDescription("📜 Queues the given playlist.")
    .addStringOption((option) =>
      option.setName("url").setDescription("Playlist url").setRequired(true)
    ),
  async execute(interaction, client, arg = undefined) {
    const musicBot = client.musicbots.getBot(interaction);

    if (musicBot) {
      if (interaction.commandName) {
        arg = interaction.options.getString("url");
      }

      if (
        arg &&
        (arg.includes("www.youtube.com") || arg.includes("youtu.be")) &&
        arg.includes("list")
      ) {
        musicBot.playlistSearch(arg, interaction.member.id);
        if (interaction.commandName) {
          interaction.deferReply();
          interaction.deleteReply();
        }
      } else {
        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor("RED")
              .setDescription("Please give a youtube playlist url."),
          ],
        });
      }
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
