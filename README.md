# Yep Bot (a blackjack and music bot for discord)

## Table of contents

- [Features](#features)
- [Deployment](#deployment)
  - Standard
  - Docker
- [Other](#other)
- [License](#license)

## Features

- Database
  - stores user ids and their corresponding balances
  - if someone runs out, they can still wager 1
- Music
  - play music from Youtube
  - search Youtube
  - queue a full playlist
  - autoplay related songs
- Blackjack and coinflip.
- Slash commands

## Deployment

- ### Standard:
  - Install dependencies (Nodejs, build-essentials, python3), make sure they are in the path
  - Clone this repository (`git clone https://github.com/aygreyG/Yep-Bot.git`)
  - Run `npm install` in the project folder
  - Edit config.json and put your token, client id (found in the [discord developer portal](https://discord.com/developers/applications)) and prefix (which should be only a character, eg. _$_) in it.
  - run: `node ./index.js` or `npm start` in the project folder
- ### Docker
  - Install docker
  - Clone this repository (`git clone https://github.com/aygreyG/Yep-Bot.git`)
  - #### Docker compose
    - You only need to download the [docker-compose.yml](docker-compose.yml) file
    - Change environmental variables in [docker-compose.yml](docker-compose.yml#L11)
    - run `docker compose up` in the project folder (`-d` for detached mode)
  - #### Building your own image
    - run `docker build -t yep-bot .` in the project folder
    - run `docker run -d -e TOKEN=<your token> -e PREFIX=<your prefix> -e CLIENTID=<your client id> -v db-data:/app/data yep-bot`
    - optional variables:
      - Minecraft server ip: `-e MCIP=<your ip>`
      - Minecraft server port: `-e MCPORT=<your port>`
      - Progress bar emote: `-e PROGRESSBAR_EMOTE=<emote name>`

## Other

- #### Slash commands
  - In order to use them your bot needs the _applications.commands_ scope, you can find it in the [discord developer portal](https://discord.com/developers/applications) under OAuth2.
  - After inviting the bot to the server you have to use the `<your prefix>registercommands` command. It only registers the commands to the given server.
- #### Required permissions
  - See as written above.
  - It is the easiest to give your bot administrator permissions.

## License

This project is licensed under the GNU General Public License v3.0 - more details in the [LICENSE](LICENSE) file.
