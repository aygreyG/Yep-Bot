const Discord = require("discord.js");
const { prefix, token } = require("./config.json");
const blackjack = require("./blackjack");
const { Users } = require("./dbObjects");
const { MusicBot } = require("./models/MusicBot");
const {
  AudioPlayerStatus,
  AudioResource,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} = require("@discordjs/voice");
const fs = require("fs");
const coinflip = require("./commands/coinflip");
const help = require("./commands/help");
const minecraft = require("./commands/minecraft");
const leave = require("./commands/leave");
const registercommands = require("./commands/registercommands");
const ping = require("./commands/ping");
const leaderboard = require("./commands/leaderboard");
const play = require("./commands/play");
const search = require("./commands/search");
const playlist = require("./commands/playlist");
const skip = require("./commands/skip");
const stop = require("./commands/stop");
const deleteSong = require("./commands/deleteSong");
const pause = require("./commands/pause");
const resume = require("./commands/resume");
const queue = require("./commands/queue");
const autoplay = require("./commands/autoplay");
const id = require("./commands/id");
const balance = require("./commands/balance");
const repeat = require("./commands/repeat");
const current = require("./commands/current");
const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES,
    Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
  ],
});
client.commands = require("./utils/getCommands")();
client.currency = new Discord.Collection();
client.musicbots = new Discord.Collection();

Reflect.defineProperty(client.musicbots, "getBot", {
  value: function getBot(interaction) {
    if (
      !client.musicbots.has(interaction.guildId) &&
      interaction.member.voice.channel &&
      !interaction.member.user.bot
    ) {
      const musicBot = new MusicBot(
        interaction.member.voice.channel,
        interaction.channel
      );
      client.musicbots.set(interaction.guildId, musicBot);
      console.log(
        `New musicbot set to guild: ${interaction.guildId} ${interaction.guild.name}!`
      );
    }
    return client.musicbots.get(interaction.guildId);
  },
});

/* add metódus hozzáadása currencyhez */
Reflect.defineProperty(client.currency, "add", {
  value: async function add(id, amount) {
    const user = client.currency.get(id);
    if (user) {
      user.balance += Number(amount);
      return user.save();
    }
    const newUser = await Users.create({ user_id: id, balance: amount });
    // console.log(amount);
    client.currency.set(id, newUser);
    console.log("new user created: " + newUser.user_id);
    return newUser;
  },
});

/* getBalance metódus hozzáadása currencyhez */

Reflect.defineProperty(client.currency, "getBalance", {
  value: async function getBalance(id) {
    const user = client.currency.get(id);
    if (user) {
      return user.balance;
    }
    await client.currency.add(id, 100);
    return 100;
  },
});

client.once("ready", async () => {
  const storedBalances = await Users.findAll();
  client.user.setActivity(`${prefix}help`, { type: "LISTENING" });
  storedBalances.forEach((b) => {
    if (b.user_id != "" && b.user_id > 0) {
      client.currency.set(b.user_id, b);
      client.users.fetch(b.user_id);
    }
  });
  console.log(`I'm ready! Logged in as '${client.user.tag}'`);
});

client.on("messageCreate", async (message) => {
  if (message.content.toLowerCase().includes("yep") && !message.author.bot)
    message.reply("COCK");
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (message.guild) {
    client.user.setActivity(`${prefix}help`, { type: "LISTENING" });
    switch (command) {
      case "registercommands":
        registercommands.execute(message);
        break;
      case "f":
      case "flip":
        coinflip.execute(message, client, args);
        break;
      case "ping":
        ping.execute(message);
        break;
      case "help":
        if (args.length > 0) {
          help.execute(message, client, args[0]);
        } else help.execute(message, client);
        break;
      case "l":
      case "leaderboard":
        leaderboard.execute(message, client);
        break;
      case "bet":
        break;
      case "b":
      case "blackjack":
        blackjack.start(message, client.currency);
        break;
      case "balance":
        balance.execute(message, client);
        break;
      case "id":
        id.execute(message, client);
        break;
      case "add":
        if (message.author.id === "107398653542400000") {
          if (message.mentions.users.size) {
            client.currency.add(message.mentions.users.first().id, args[1]);
            return message.channel.send({
              content: `${message.mentions.users.first()} now has ${client.currency.getBalance(
                message.mentions.users.first().id
              )}`,
            });
          }
          client.currency.add(message.author.id, args[0]);
          message.reply({
            content: `you now have ${client.currency.getBalance(
              message.author.id
            )}`,
          });
          return;
        }
        break;
      case "playlist":
        playlist.execute(message, client, args.join(" "));
        break;
      case "play":
      case "p":
        play.execute(message, client, args.join(" "));
        break;
      case "s":
      case "search":
        if (args.length > 0) search.execute(message, client, args.join(" "));
        break;
      case "n":
      case "next":
      case "skip":
        skip.execute(message, client);
        break;
      case "pause":
        pause.execute(message, client);
        break;
      case "resume":
        resume.execute(message, client);
        break;
      case "stop":
        stop.execute(message, client);
        break;
      case "delete":
      case "del":
        deleteSong.execute(message, client, args.join(" "));
        break;
      case "q":
      case "queue":
        queue.execute(message, client);
        break;
      case "ap":
      case "autoplay":
        autoplay.execute(message, client);
        break;
      case "leave":
        leave.execute(message, client);
        break;
      case "repeat":
      case "loop":
        repeat.execute(message, client);
        break;
      case "c":
      case "current":
        current.execute(message, client);
        break;
      case "minecraft":
      case "mc":
        if (args.length > 0) {
          minecraft.execute(message, args[0]);
        } else {
          minecraft.execute(message);
        }
        break;
      default:
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      embed: [
        new Discord.MessageEmbed()
          .setColor("RED")
          .setDescription("There was an error while executing this command!"),
      ],
      ephemeral: true,
    });
  }
});

client.on("voiceStateUpdate", (oldState, newState) => {
  if (newState.channel == null) {
    if (oldState.channel.members.size == 1) {
      if (oldState.channel.members.first().id == client.user.id) {
        leave.execute(oldState.channel, client);
      }
    }
  }
});

client.login(token);
