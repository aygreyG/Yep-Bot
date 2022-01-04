# Yep Bot (a blackjack and music bot for discord)

---
**_THIS IS A WORK IN PROGRESS, USE IT AT YOUR OWN RISK_**

---
*méé nincs readme? 😂
Minek legyen?
Meméne?*

### Features:
- Database which stores user ids and their corresponding balances.
- Music playing.
- Blackjack and coinflip.

### What to look out for:
- There might be comments, commits or other things that are written in hungarian.
- There is an add command which only works if you change the id [here](./dcbot.js#L309) to your own id, you can easily get your id with the id command.
- If you have a problem just open an issue.
- You can find a discord bot token in the first versions, because this was a private repository. I already changed it.

### Dependencies:
- Nodejs version: 16 and up
- Discordjs version: v13
- Build-essentials and python3
- General:
    - discord.js
    - sequelize
    - sqlite3
- Voice: (run *node ./dep.js*)
    - @discordjs/voice
    - @discordjs/opus
    - ffmpeg-static
    - libsodium-wrappers instead of sodium

- Youtube stuff:
    - ytdl-core
    - youtube-dl-exec
    - ytsr (for searching on youtube)

### Deployment:
- Install the latest version of node (for now Node v16.6.0 or higher)
- Run *npm install* in your project folder
- Edit config.json and put your token and prefix (which should be only a character, eg. *$*) in it.
- run: *node ./dcbot.js*
