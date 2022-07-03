const Discord = require("discord.js");
const prefix = process.env.PREFIX || require("./config.json").PREFIX;
const token = process.env.TOKEN || require("./config.json").TOKEN;
const { Users } = require("./database/dbObjects");
const { MusicBot } = require("./models/MusicBot");
const leave = require("./commands/leave");
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
client.blackjackGames = new Discord.Collection();

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

/* adding 'add' method to client.currency  */
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

/* adding 'getBalance' method to client.currency */

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
  client.user.setActivity(prefix == "/" ? "/help" : `/help or ${prefix}help`, {
    type: "WATCHING",
  });
  storedBalances.forEach((b) => {
    if (b.user_id != "" && b.user_id > 0) {
      client.currency.set(b.user_id, b);
      client.users.fetch(b.user_id);
    }
  });
  console.log(`I'm ready! Logged in as '${client.user.tag}'`);
});

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  client.user.setActivity(prefix == "/" ? "/help" : `/help or ${prefix}help`, {
    type: "WATCHING",
  });

  const command = client.commands.get(cmd);
  if (!command) return;

  try {
    await command.execute(message, client, args.join(" "));
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

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand) return;
  const command = client.commands.get(interaction.commandName);

  client.user.setActivity(prefix == "/" ? "/help" : `/help or ${prefix}help`, {
    type: "WATCHING",
  });

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
