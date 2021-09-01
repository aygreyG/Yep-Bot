const Discord = require("discord.js");
const { prefix, token } = require("./config.json");
const blackjack = require("./blackjack");
const coinflip = require("./coinflip");
const { oneVOne } = require("./1v1");
const { Users } = require("./dbObjects");

const {
  AudioPlayerStatus,
  AudioResource,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} = require("@discordjs/voice");

const { Track } = require("./track.js");
const { MusicSubscription } = require("./subs.js");

// import { Track } from "./track";
// import { MusicSubscription } from "./subs";

const currency = new Discord.Collection();
const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});

// Help szövege:
const helpEmbed = new Discord.MessageEmbed()
  .setColor("#ADE9F2")
  .setDescription("__**Commands:**__")
  .addFields(
    { name: `${prefix}help`, value: "❓ Lists all available commands." },
    {
      name: `${prefix}b/${prefix}blackjack`,
      value: "🃏 Starts a new blackjack game.",
    },
    {
      name: `${prefix}f/${prefix}flip <your bet> <heads/tails>`,
      value: "🪙 Flips a coin.",
    },
    {
      name: `${prefix}1v1 <your opponent's tag>`,
      value:
        "😒👉👈😒 Challenge a user on the server, whoever guesses closer to the random number between 0-100 wins!",
    },
    {
      name: `${prefix}balance/${prefix}balance <user tag>`,
      value: "💰 Shows you your or the tagged user's balance.",
    },
    {
      name: `${prefix}l/${prefix}leaderboard`,
      value: "📋 Shows you the top 15 wealthiest user on the server.",
    },
    {
      name: `${prefix}ping`,
      value: "🏓 Pings the bot, if it's available it will answer.",
    }
  );

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
    currency.set(id, newUser);
    console.log("new user created: " + newUser.user_id);
    return newUser;
  },
});

/* getBalance metódus hozzáadása currencyhez */

Reflect.defineProperty(currency, "getBalance", {
  value: function getBalance(id) {
    const user = currency.get(id);
    if (user) {
      return user.balance;
    }
    currency.add(id, 100);
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

// Key: Discord.Snowflake, Value: MusicSubscription
const subcriptions = new Map();

client.on("messageCreate", async (message) => {
  if (message.content.toLowerCase().includes("yep") && !message.author.bot)
    message.reply("COCK");
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (!message.guild) {
    switch (command) {
      case "f":
      case "flip":
        if (
          (parseInt(args[0]) > 0 &&
            parseInt(args[0]) <= currency.getBalance(message.author.id) &&
            (args[1].toLowerCase() == "tails" ||
              args[1].toLowerCase() == "heads")) ||
          (parseInt(args[0]) == 1 &&
            currency.getBalance(message.author.id) <= 0 &&
            (args[1].toLowerCase() == "tails" ||
              args[1].toLowerCase() == "heads"))
        ) {
          coinflip.flip(
            message,
            currency,
            parseInt(args[0]),
            args[1].toLowerCase()
          );
        } else if (
          (parseInt(args[1]) > 0 &&
            parseInt(args[1]) <= currency.getBalance(message.author.id) &&
            (args[0].toLowerCase() == "tails" ||
              args[0].toLowerCase() == "heads")) ||
          (parseInt(args[1]) == 1 &&
            currency.getBalance(message.author.id) <= 0 &&
            (args[0].toLowerCase() == "tails" ||
              args[0].toLowerCase() == "heads"))
        ) {
          coinflip.flip(
            message,
            currency,
            parseInt(args[1]),
            args[0].toLowerCase()
          );
        }
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
        message.channel.send({ embeds: [helpEmbed] });
        break;
      case "balance":
        message.channel.send({
          embeds: [
            new Discord.MessageEmbed()
              .setColor("DARK_ORANGE")
              .setDescription(
                `${message.author}, you have: ${currency.getBalance(
                  message.author.id
                )}`
              ),
          ],
        });
        break;
      default:
    }
  } else {
    let subscription = subcriptions.get(message.guildId);
    switch (command) {
      case "1v1":
        if (args[0] !== undefined && message.mentions.users.size) {
          if (
            message.mentions.users.first().id !== message.author.id &&
            !message.mentions.users.first().bot
          ) {
            // console.log(message.author.id + ' ' + args[0].id);
            oneVOne(
              message.channel,
              currency,
              message.author.id,
              message.mentions.users.first().id
            );
          }
        }
        break;
      case "f":
      case "flip":
        if (
          (parseInt(args[0]) > 0 &&
            parseInt(args[0]) <= currency.getBalance(message.author.id) &&
            (args[1].toLowerCase() == "tails" ||
              args[1].toLowerCase() == "heads")) ||
          (parseInt(args[0]) == 1 &&
            currency.getBalance(message.author.id) <= 0 &&
            (args[1].toLowerCase() == "tails" ||
              args[1].toLowerCase() == "heads"))
        ) {
          coinflip.flip(
            message,
            currency,
            parseInt(args[0]),
            args[1].toLowerCase()
          );
        } else if (
          (parseInt(args[1]) > 0 &&
            parseInt(args[1]) <= currency.getBalance(message.author.id) &&
            (args[0].toLowerCase() == "tails" ||
              args[0].toLowerCase() == "heads")) ||
          (parseInt(args[1]) == 1 &&
            currency.getBalance(message.author.id) <= 0 &&
            (args[0].toLowerCase() == "tails" ||
              args[0].toLowerCase() == "heads"))
        ) {
          coinflip.flip(
            message,
            currency,
            parseInt(args[1]),
            args[0].toLowerCase()
          );
        }
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
        message.channel.send({ embeds: [helpEmbed] });
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
                  `${message.mentions.users.first()} has: ${currency.getBalance(
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
                  `${message.author}, you have: ${currency.getBalance(
                    message.author.id
                  )}`
                ),
            ],
          });
        }
        break;
      case "id":
        if (args.length > 0) {
          message.channel.send({ embeds: [message.mentions.users.first().id] });
        }
        break;
      case "add":
        if (message.author.id === "107398653542400000") {
          if (message.mentions.users.size) {
            currency.add(message.mentions.users.first().id, args[1]);
            return message.channel.send(
              `${message.mentions.users.first()} now has ${currency.getBalance(
                message.mentions.users.first().id
              )}`
            );
          }
          currency.add(message.author.id, args[0]);
          message.reply(
            `you now have ${currency.getBalance(message.author.id)}`
          );
        }
        break;
      case "play":
      case "p":
        const url = args[0];
        // console.log(message.member.voice.channel);

        if (
          !subcriptions.has(message.guildId) &&
          message.member.voice.channel &&
          message.member instanceof Discord.GuildMember
        ) {
          // TODO: remove!! 
          console.log('eljut ide');
          const channel = message.member.voice.channel;
          subcription = new MusicSubscription(
            joinVoiceChannel({
              channelId: channel.id,
              guildId: channel.guild.id,
              adapterCreator: channel.guild.voiceAdapterCreator,
            })
          );
          subcription.voiceConnection.on("error", console.error);
          subcriptions.set(message.guildId, subcription);
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

        try {
          await entersState(
            subcription.voiceConnection,
            VoiceConnectionStatus.Ready,
            10e3
          );
        } catch (error) {
          console.error(error);
          message.channel.send({
            embeds: [
              new Discord.MessageEmbed()
                .setColor("RED")
                .setDescription("Failed to join a voice channel!"),
            ],
          });
          subcriptions.delete(message.guildId);
          return;
        }

        try {
          const track = await Track.from(url, {
            onStart() {
              message.channel.send({
                embeds: [
                  new Discord.MessageEmbed()
                    .setColor("GREEN")
                    .setDescription("Now Playing!"),
                ],
              });
            },
            onFinish() {
              message.channel.send({
                embeds: [
                  new Discord.MessageEmbed()
                    .setColor("GREEN")
                    .setDescription("Finished playing!"),
                ],
              });
            },
            onError(error) {
              message.channel.send({
                embeds: [
                  new Discord.MessageEmbed()
                    .setColor("RED")
                    .setDescription("Failed!"),
                ],
              });
              console.error(error);
            },
          });

          subscription.enqueue(track);
        } catch (error) {
          console.error(error);
        }
        break;
      case "skip":
        // let subscription = subcriptions.get(message.guildId);
        if (subscription) {
          subscription.audioPlayer.stop();
          message.channel.send({
            embeds: [
              new Discord.MessageEmbed()
                .setColor("GREEN")
                .setDescription("Skipped song!"),
            ],
          });
        } else {
          message.channel.send({
            embeds: [
              new Discord.MessageEmbed()
                .setColor("GREEN")
                .setDescription("Not playing on this server!"),
            ],
          });
        }
        break;
      case "leave":
        // let subscription = subcriptions.get(message.guildId);
        if (subscription) {
          subscription.voiceConnection.destroy();
          subcriptions.delete(message.guildId);
          message.channel.send({
            embeds: [
              new Discord.MessageEmbed()
                .setColor("GREEN")
                .setDescription("Skipped song!"),
            ],
          });
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
      default:
    }
  }
});

client.login(token);

module.exports = { currency };
