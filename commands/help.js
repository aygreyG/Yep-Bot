const { MessageEmbed } = require("discord.js");
const Discord = require("discord.js");
const { commands } = require("../constants/commandhelp");
const paginator = require("../utils/paginator");
const embedcolor = "#ADE9F2";

/**
 *
 * @param {Discord.TextChannel} channel
 * @param {string} arg
 */
module.exports = (channel, arg) => {
  if (arg == "") {
    const fieldnames = [];
    const items = [];

    commands.forEach((cmd) => {
      fieldnames.push(cmd.name);
      items.push(cmd.description);
    });
    paginator(
      channel,
      "__**Commands:**__",
      items,
      fieldnames,
      7,
      90000,
      embedcolor
    );
  } else {
    const com = commands.find((cmd) => {
      return cmd.name.includes(arg);
    });
    if (com) {
      channel.send({
        embeds: [
          new MessageEmbed()
            .setColor(embedcolor)
            .setDescription("__**Command and what it does**__")
            .addField(com.name, com.description),
        ],
      });
    } else {
      channel.send({
        embeds: [
          new MessageEmbed()
            .setColor("RED")
            .setDescription("Couldn't find that command!"),
        ],
      });
    }
  }
};
