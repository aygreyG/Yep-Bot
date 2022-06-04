const mcutil = require("minecraft-server-util");
let { minecraftIp, minecraftPort } = require("../config.json");
const { MessageEmbed, Message } = require("discord.js");

/**
 *
 * @param {string} mcIp
 * @param {Message} message
 */
module.exports = async (message, mcIp = minecraftIp) => {
  const reply = (description, color, thumbnail) => {
    const embed = new MessageEmbed()
      .setColor(color)
      .setDescription(description)
      .setTitle("Minecraft Server Status");

    if (thumbnail) {
      embed.setThumbnail("attachment://minecraft_logo.png");

      message.reply({
        embeds: [embed],
        files: [
          {
            attachment: "./tmp.png",
            name: "minecraft_logo.png",
          },
        ],
      });
    } else {
      embed.setThumbnail(
        "https://cdn.icon-icons.com/icons2/2699/PNG/512/minecraft_logo_icon_168974.png"
      );

      message.reply({
        embeds: [embed],
      });
    }
  };

  if (mcIp !== "your-ip(optional)") {
    if (!Number(minecraftPort)) {
      minecraftPort = 25565;
    }
    try {
      console.log(
        `Starting status check on minecraft server: ${mcIp}:${minecraftPort}`
      );
      const { motd, players, version, favicon } = await mcutil.status(
        mcIp,
        Number(minecraftPort)
      );
      console.log("Status check successful");
      let playersString = "";
      if (players.sample) {
        players.sample.forEach((player, index) => {
          if (index !== players.sample.length - 1) {
            playersString += player.name + ", ";
          } else {
            playersString += player.name + ".";
          }
        });
      }
      let hasIcon = false;
      if (favicon) {
        require("fs").writeFile(
          "tmp.png",
          favicon.split("base64,")[1],
          "base64",
          () => {}
        );
        hasIcon = true;
      }
      reply(
        `${mcIp} (${version.name})\n${motd.clean} (${players.online}/${
          players.max
        })${
          players.online > 0 && players.sample && players.sample.length > 0
            ? `:\nOnline players: ${playersString}`
            : "."
        }`,
        "DARK_GREEN",
        hasIcon
      );
    } catch (err) {
      console.error("Status check failed with error: " + err.message);
      reply("Failed: Status check failed with error.", "RED", false);
    }
  } else {
    reply("Failed: There is no server ip specified.", "RED", false);
  }
};
