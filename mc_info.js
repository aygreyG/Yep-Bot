const mcutil = require("minecraft-server-util");
let { minecraftIp, minecraftPort } = require("./config.json");

module.exports = {
  mcStatusCheck: async () => {
    if (minecraftIp !== "your-ip(optional)") {
      if (!Number(minecraftPort)) {
        minecraftPort = 25565;
      }
      try {
        console.log(
          `Starting status check on minecraft server: ${minecraftIp}:${minecraftPort}`
        );
        const { motd, players, version, favicon } = await mcutil.status(
          minecraftIp,
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
          require("fs").writeFile("tmp.png", favicon.split("base64,")[1],"base64",()=>{});
          hasIcon = true;
        }
        return [
          true,
          `${minecraftIp} (${version.name})\n${motd.clean} (${players.online}/${players.max})${
            players.online > 0 && players.sample && players.sample.length > 0 ? `:\nOnline players: ${playersString}` : "."
          }`,
          hasIcon,
        ];
      } catch (err) {
        console.error("Status check failed with error: " + err.message);
        return [false, "Failed: Status check failed with error.", false];
      }
    } else return [false, "Failed: There is no server ip specified.", false];
  },
};
