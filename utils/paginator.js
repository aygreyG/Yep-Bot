const { MessageEmbed, MessageActionRow, MessageButton, TextChannel } = require("discord.js");

/**
 *
 * @param {TextChannel} channel
 * @param {string} title
 * @param {string[]} items
 */
module.exports = async (
  channel,
  title,
  items,
  fieldnames=[],
  maxItemCount=5,
  timeout=90000,
  color="WHITE"
) => {
  const embed = new MessageEmbed().setColor(color).setTitle(title);
  let allpages = Math.ceil(items.length / maxItemCount);
  let currpage = 1;
  const setContent = () => {
    embed.setFields([]);
    embed.setFooter({ text: `Page: ${currpage}/${allpages}` });
    index = 0;
    for (const item of items) {
      if (
        index + 1 - (currpage - 1) * maxItemCount <= maxItemCount &&
        index + 1 - (currpage - 1) * maxItemCount > 0
      ) {
        if (fieldnames.length == 0) {
          embed.addField((index + 1).toString(), item);
        } else {
          embed.addField(fieldnames[index], item);
        }
      }
      index++;
    }
  };

  if (allpages == 1) {
    items.forEach((item, idx) => {
      embed.addField(fieldnames[idx], item);
    });
    channel.send({
      embeds: [embed]
    });
    return;
  }

  setContent();

  const row = new MessageActionRow().addComponents([
    new MessageButton()
      .setCustomId("1")
      .setLabel("PREVIOUS")
      .setStyle("SUCCESS"),
    new MessageButton().setCustomId("2").setLabel("NEXT").setStyle("SUCCESS"),
    new MessageButton().setCustomId("X").setLabel("X").setStyle("DANGER"),
  ]);

  const msg = await channel.send({
    embeds: [embed],
    components: [row],
  });

  const collector = msg.createMessageComponentCollector({
    componentType: "BUTTON",
    time: timeout,
  });

  collector.on("collect", (i) => {
    switch (i.customId) {
      case "1":
        if (currpage == 1) {
          const nolessEmbed = new MessageEmbed()
            .setColor("DARK_RED")
            .setDescription("There is no previous page!");
          i.reply({
            embeds: [nolessEmbed],
            ephemeral: true,
          });
        } else {
          currpage--;
          setContent();
          msg.edit({ embeds: [embed] });
          i.deferReply();
          i.deleteReply();
        }
        break;
      case "2":
        if (currpage == allpages) {
          const nopagesEmbed = new MessageEmbed()
            .setColor("DARK_RED")
            .setDescription("There are no more pages!");
          i.reply({
            embeds: [nopagesEmbed],
            ephemeral: true,
          });
        } else {
          currpage++;
          setContent();
          msg.edit({ embeds: [embed] });
          i.deferReply();
          i.deleteReply();
        }
        break;
      case "X":
        i.deferReply();
        i.deleteReply();
        collector.stop();
        break;
      default:
        break;
    }
  });

  collector.on("end", (collected, reason) => {
    row.components.forEach((component) => {
      component.setDisabled(true);
    });
    msg.edit({ components: [row] });
  });
};
