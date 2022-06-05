const Discord = require("discord.js");
const { prefix, token } = require("./config.json");
const blackjack = require("./blackjack");
const coinflip = require("./commands/coinflip");
const help = require("./commands/help");
const minecraft = require("./commands/minecraft");
const registercommands = require("./commands/registercommands");
const { Users } = require("./dbObjects");
const { MusicBot } = require("./music");
const {
  AudioPlayerStatus,
  AudioResource,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} = require("@discordjs/voice");
const fs = require("fs");
const currency = new Discord.Collection();
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
client.commands = new Discord.Collection();
const commandFiles = fs
  .readdirSync("./commands/")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data) {
    client.commands.set(command.data.name, command);
  }
}

/* add metódus hozzáadása currencyhez */

const leaderboardEmbed = (members) => {
  const mm = members.map((member) => member.id);
  return new Discord.MessageEmbed().setColor("ORANGE").setDescription(
    currency
      .sort((a, b) => b.balance - a.balance)
      .filter(
        (user) =>
          client.users.cache.has(user.user_id) &&
          mm.includes(user.user_id) &&
          user.user_id != ""
      )
      .first(15)
      .map(
        (user, position) =>
          `#${position + 1} 👉 ${
            client.users.cache.get(user.user_id).username
          }: ${user.balance}`
      )
      .join("\n")
  );
};

Reflect.defineProperty(currency, "add", {
  value: async function add(id, amount) {
    const user = currency.get(id);
    if (user) {
      user.balance += Number(amount);
      return user.save();
    }
    const newUser = await Users.create({ user_id: id, balance: amount });
    // console.log(amount);
    currency.set(id, newUser);
    console.log("new user created: " + newUser.user_id);
    return newUser;
  },
});

/* getBalance metódus hozzáadása currencyhez */

Reflect.defineProperty(currency, "getBalance", {
  value: async function getBalance(id) {
    const user = currency.get(id);
    if (user) {
      return user.balance;
    }
    await currency.add(id, 100);
    return 100;
  },
});

client.once("ready", async () => {
  const storedBalances = await Users.findAll();
  client.user.setActivity(`${prefix}help`, { type: "LISTENING" });
  storedBalances.forEach((b) => {
    if (b.user_id != "" && b.user_id != "Ez egy id" && b.user_id > 0) {
      currency.set(b.user_id, b);
      client.users.fetch(b.user_id);
    }
  });
  console.log("I'm ready!" + ` Logged in as '${client.user.tag}'`);
});

// Key: guildId, Value: MusicBot
const subcriptions = new Map();

client.on("messageCreate", async (message) => {
  if (message.content.toLowerCase().includes("yep") && !message.author.bot)
    message.reply("COCK");
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (message.guild) {
    client.user.setActivity(`${prefix}help`, { type: "LISTENING" });
    let musicBot = subcriptions.get(message.guildId);
    switch (command) {
      case "registercommands":
        registercommands.execute(message);
        break;
      case "f":
      case "flip":
        if (args.length > 0) coinflip.execute(message, currency, args);
        break;
      case "ping":
        message.channel.send({
          embeds: [
            new Discord.MessageEmbed()
              .setColor("#D57A6F")
              .setDescription(`Pong 🏓 ${message.author}`),
          ],
        });
        break;
      case "help":
        if (args.length > 0) {
          help.execute(message, args[0]);
        } else help.execute(message);
        break;
      case "l":
      case "leaderboard":
        message.guild.members
          .fetch()
          .then((members) => {
            message.channel.send({ embeds: [leaderboardEmbed(members)] });
          })
          .catch(console.error);
        break;
      case "bet":
        break;
      case "b":
      case "blackjack":
        blackjack.start(message, currency);
        break;
      case "balance":
        if (message.mentions.users.size) {
          message.channel.send({
            embeds: [
              new Discord.MessageEmbed()
                .setColor("DARK_ORANGE")
                .setDescription(
                  `${message.mentions.users.first()} has: ${await currency.getBalance(
                    message.mentions.users.first().id
                  )}`
                ),
            ],
          });
        } else {
          message.channel.send({
            embeds: [
              new Discord.MessageEmbed()
                .setColor("DARK_ORANGE")
                .setDescription(
                  `${message.author}, you have: ${await currency.getBalance(
                    message.author.id
                  )}`
                ),
            ],
          });
        }
        break;
      case "id":
        if (args.length > 0) {
          message.channel.send({ content: message.mentions.users.first().id });
        }
        break;
      case "add":
        if (message.author.id === "107398653542400000") {
          if (message.mentions.users.size) {
            currency.add(message.mentions.users.first().id, args[1]);
            return message.channel.send({
              content: `${message.mentions.users.first()} now has ${currency.getBalance(
                message.mentions.users.first().id
              )}`,
            });
          }
          currency.add(message.author.id, args[0]);
          message.reply({
            content: `you now have ${currency.getBalance(message.author.id)}`,
          });
          return;
        }
        break;
      case "playlist":
        if (
          !musicBot &&
          message.member.voice.channel &&
          message.member instanceof Discord.GuildMember
        ) {
          const channel = message.member.voice.channel;
          musicBot = new MusicBot(channel, message.channel);
          subcriptions.set(message.guildId, musicBot);
          console.log(
            `New musicbot set to guild: ${message.guildId} ${message.guild.name}!`
          );
        }

        if (!subcriptions.has(message.guildId)) {
          message.channel.send({
            embeds: [
              new Discord.MessageEmbed()
                .setColor("RED")
                .setDescription("Join a voice channel and try again!"),
            ],
          });
          return;
        }

        if (args.length > 0) {
          if (args[0].includes("www.youtube.com") && args[0].includes("list")) {
            musicBot.playlistSearch(args[0], message.author.id);
          } else {
            message.channel.send({
              embeds: [
                new Discord.MessageEmbed()
                  .setColor("RED")
                  .setDescription("It is not a playlist!"),
              ],
            });
          }
        }
        break;
      case "play":
      case "p":
        const url = args[0];

        if (
          !musicBot &&
          message.member.voice.channel &&
          message.member instanceof Discord.GuildMember
        ) {
          const channel = message.member.voice.channel;
          musicBot = new MusicBot(channel, message.channel);
          subcriptions.set(message.guildId, musicBot);
          console.log(
            `New musicbot set to guild: ${message.guildId} ${message.guild.name}!`
          );
        }

        if (!subcriptions.has(message.guildId)) {
          message.channel.send({
            embeds: [
              new Discord.MessageEmbed()
                .setColor("RED")
                .setDescription("Join a voice channel and try again!"),
            ],
          });
          return;
        }

        if (
          url &&
          (url.includes("www.youtube.com") || url.includes("youtu.be"))
        ) {
          musicBot.playUrl(url);
        } else if (args.length > 0) {
          const searchString = args.join(" ");
          musicBot.searchTrack(searchString, true);
        }

        break;
      case "s":
      case "search":
        if (
          !musicBot &&
          message.member.voice.channel &&
          message.member instanceof Discord.GuildMember
        ) {
          const channel = message.member.voice.channel;
          musicBot = new MusicBot(channel, message.channel);
          subcriptions.set(message.guildId, musicBot);
          console.log(
            `New musicbot set to guild: ${message.guildId} ${message.guild.name}!`
          );
        }

        if (!subcriptions.has(message.guildId)) {
          message.channel.send({
            embeds: [
              new Discord.MessageEmbed()
                .setColor("RED")
                .setDescription("Join a voice channel and try again!"),
            ],
          });
          return;
        }

        if (musicBot) {
          if (args.length > 0) {
            musicBot.searchTrack(args.join(" "), false, message.author.id);
          }
        }
        break;
      case "n":
      case "next":
      case "skip":
        if (musicBot) {
          musicBot.skipMusic();
        }
        break;
      case "pause":
        if (musicBot) {
          musicBot.pause();
        }
        break;
      case "resume":
        if (musicBot) {
          musicBot.resume();
        }
        break;
      case "stop":
        if (musicBot) musicBot.stop();
        break;
      case "delete":
      case "del":
        if (musicBot) {
          if (parseInt(args[0])) {
            musicBot.deleteFromQueue(args[0], true);
          } else {
            musicBot.deleteFromQueue(args.join(" "), false);
          }
        }
        break;
      case "q":
      case "queue":
        if (musicBot) musicBot.queuePrint();
        break;
      case "ap":
      case "autoplay":
        if (musicBot) musicBot.autoPlay();
        break;
      case "leave":
        // let subscription = subcriptions.get(message.guildId);
        if (musicBot) {
          musicBot.leave();
          subcriptions.delete(message.guildId);

          message.react("👍");
        } else {
          message.channel.send({
            embeds: [
              new Discord.MessageEmbed()
                .setColor("RED")
                .setDescription("Not in this server!"),
            ],
          });
        }
        break;
      case "repeat":
      case "loop":
        if (musicBot) musicBot.repeatChange();
        break;
      case "c":
      case "current":
        if (musicBot) musicBot.currentlyPlaying();
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
    await command.execute(interaction, currency);
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
        const musicBot = subcriptions.get(oldState.guild.id);
        musicBot.leave();
        subcriptions.delete(oldState.guild.id);
      }
    }
  }
});

client.login(token);

module.exports = { currency };
