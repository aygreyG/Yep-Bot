const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("📃 Shows you the queue."),
  execute(interaction, client, arg = undefined) {
    const musicBot = client.musicbots.getBot(interaction);

    if (musicBot) {
      let response = musicBot.queuePrint();

      if (response) {
        interaction.reply({ embeds: [response] });
        return;
      }

      if (interaction.commandName) {
        interaction.deferReply();
        interaction.deleteReply();
      }
    } else {
      interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor("RED")
            .setDescription("There is no bot in a voice channel!"),
        ],
      });
    }
  },
};
