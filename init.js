const force = process.argv.includes("--force") || process.argv.includes("-f");

require("./database/syncDB")(force);

try {
  const config = require("./config.json");
} catch (err) {
  const fs = require("fs");
  try {
    fs.writeFile(
      "./config.json",
      `{
        "TOKEN": "your-token",
        "CLIENTID": "your-bot-clientid",
        "PREFIX": "your-prefix",
        "MCIP": "your-ip(optional)",
        "MCPORT": "your-port(optional)",
        "PROGRESSBAR_EMOTE": "🔘"
      }`,
      "utf-8",
      () => {
        console.log(
          `Config.json created successfully.
          PLEASE UPDATE CONFIG.JSON BEFORE STARTING THE BOT!`
        );
      }
    );
  } catch (e) {
    console.error(e);
  }
}
