const Discord = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { Coins } = require("../database/dbObjects");

// -flip heads/tails <bet>
// -flip <bet> heads/tails

module.exports = {
  data: new SlashCommandBuilder()
    .setName("flip")
    .setDescription("🪙 Flips a coin.")
    .addStringOption((option) =>
      option
        .setName("choice")
        .setDescription("Heads or tails")
        .setRequired(true)
        .addChoices(
          { name: "heads", value: "heads" },
          { name: "tails", value: "tails" }
        )
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount of your bet.")
        .setRequired(true)
    ),
  async execute(interaction, client, args = undefined) {
    const error = (description) => {
      interaction.reply({
        embeds: [
          new Discord.MessageEmbed()
            .setAuthor({ name: "Yep Coinflip" })
            .setColor("RED")
            .setThumbnail("https://i.imgur.com/Ol3ZXQV.png")
            .setDescription(description),
        ],
      });
    };
    const reply = (fieldname, fieldvalue, footer, color) => {
      interaction.reply({
        embeds: [
          new Discord.MessageEmbed()
            .setColor(color)
            .setAuthor({ name: "Yep Coinflip" })
            .setThumbnail("https://i.imgur.com/Ol3ZXQV.png")
            .addField(fieldname, fieldvalue)
            .setFooter({
              text: footer,
            }),
        ],
      });
    };
    let user;
    let bet;
    let choice;
    if (!interaction.commandName) {
      args = args.split(" ");
      if (args.length < 2) {
        error("You didn't give enough arguments!");
        return;
      }

      user = interaction.author;
      if (parseInt(args[0]) > 0) {
        bet = parseInt(args[0]);
        choice = args[1];
      } else if (parseInt(args[1])) {
        bet = parseInt(args[1]);
        choice = args[0];
      } else {
        bet = -1;
        choice = args[0];
      }
      choice = choice.toLowerCase().trim();
    } else {
      user = interaction.member.user;
      bet = interaction.options.getInteger("amount");
      choice = interaction.options.getString("choice");
    }
    const balance = await client.currency.getBalance(user.id);
    if (balance < bet) {
      error("You don't have enough.");
      return;
    }
    if (!["tails", "heads"].includes(choice)) {
      error("Invalid argument.");
      return;
    }

    let coins = await Coins.findAll();
    if (coins.length == 0) {
      await Coins.create({ cointype: "heads", amount: 0 });
      await Coins.create({ cointype: "tails", amount: 0 });
      coins = await Coins.findAll();
    }

    let heads = coins[0];
    let tails = coins[1];

    // rand < 0.5 HEADS
    // rand >= 0.5 TAILS
    const rand = Math.random();

    if (rand < 0.5) {
      heads.amount++;
      heads.save();
    } else {
      tails.amount++;
      tails.save();
    }

    if (
      (choice == "heads" && rand < 0.5) ||
      (choice == "tails" && rand >= 0.5)
    ) {
      client.currency.add(user.id, bet);
      console.log(`${user.username} won: ${bet}`);
      reply(
        `${choice.toUpperCase()}`,
        `${user.username} won: \`${bet}\``,
        `Tails: ${tails.amount}, Heads: ${heads.amount}.`,
        "#AFEC28"
      );
    } else {
      client.currency.add(user.id, -bet);
      console.log(`${user.username} lost: ${bet}`);
      reply(
        `${choice == "heads" ? "TAILS" : "HEADS"}`,
        `${user.username} lost: \`${bet}\``,
        `Tails: ${tails.amount}, Heads: ${heads.amount}.`,
        "#A00000"
      );
    }
  },
};
