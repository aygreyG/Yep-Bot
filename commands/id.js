const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("id")
    .setDescription("🆔 Gives the id of the mentioned user.")
    .addUserOption((option) =>
      option
        .setRequired(true)
        .setName("user")
        .setDescription("The user who's id you would like to get.")
    ),
  execute(interaction, client, arg = undefined) {
    // interaction.user.id
    // message.mentions.users.first().id

    let embed = new MessageEmbed().setColor("GREY");

    if (!interaction.commandName) {
      if (interaction.mentions.users.first()) {
        embed.setDescription(
          `${interaction.mentions.users.first().username}'s id: ${
            interaction.mentions.users.first().id
          }`
        );
      } else {
        embed.setDescription("Your id: " + interaction.author.id);
      }
    } else {
      let user = interaction.options.getUser("user");

      if (user) {
        embed.setDescription(`${user.username}'s id: \`${user.id}\`.`);
      }
    }

    interaction.reply({ embeds: [embed] });
  },
};
