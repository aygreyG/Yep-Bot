const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription(
      "❔ Searches youtube and gives you 4 options to choose from."
    )
    .addStringOption((option) =>
      option.setName("song").setDescription("The song name to search for.")
    ),
  execute(interaction, client, arg = undefined) {
    const musicBot = client.musicbots.getBot(interaction);
    if (interaction.commandName) {
      arg = interaction.options.getString("song");
    }

    if (musicBot) {
      if (!arg) {
        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor("RED")
              .setDescription("Search string is mandatory!"),
          ],
        });
        return;
      }
      musicBot.searchTrack(arg, false, interaction.member.id);
      if (interaction.commandName) {
        interaction.deferReply();
        interaction.deleteReply();
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
