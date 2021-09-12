# BlackjackBot

*méé nincs readme? 😂
Minek legyen?
Meméne?*

### Dependencies:
- Nodejs version: 16 and up
- Discordjs version: v13
- General:
    - discord.js
    - sequelize
    - sqlite3
- Voice: (for some of it vs and python is needed, run *node ./dep.js*)
    - @discordjs/voice
    - @discordjs/opus
    - ffmpeg-static
    - sodium helyett libsodium-wrappers

- Youtube stuff:
    - ytdl-core
    - youtube-dl-exec

### Deployment:
- Get the dependencies
- Make config.json and put your token and prefix like this:
```
{
    "prefix": "your-prefix",
    "token": "your-token"
}
```
- run: *node ./dbInit.js* (this creates your database)
- run: *node ./dcbot.js*