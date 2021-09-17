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
- Blackjack and coinflip (there is also a 1v1 feature which is kinda bad).

### What to look out for:
- There might be comments, commits or other things that are written in hungarian.
- There is an add command which only works if you change the id [here](./dcbot.js#L309) to your own id, you can easily get your id with the id command.
- If you have a problem just open an issue.

### Dependencies:
- Nodejs version: 16 and up
- Discordjs version: v13
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
- Get the dependencies
- Make config.json and put your token and prefix (which should be only a character, eg. *$*) like this:
```
{
    "prefix": "your-prefix",
    "token": "your-token"
}
```
- run: *node ./dbInit.js* (this creates your database)
- run: *node ./dcbot.js*
