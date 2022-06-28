# Yep Bot (a blackjack and music bot for discord)

### Features:
- Database which stores user ids and their corresponding balances.
- Music playing.
- Blackjack and coinflip.

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
- run: *node ./dcbot.js* or *npm start*
- If you want to have slash commands register it in your server with the *registercommands* command 
