const Discord = require("discord.js");
const fs = require("fs");
const { Coins } = require("../dbObjects");

// -flip heads/tails <bet>
// -flip <bet> heads/tails

module.exports = async (message, currency, bet, headsOrTails) => {
  const balance = await currency.getBalance(message.author.id);

  //   (parseInt(args[0]) > 0 &&
  //     parseInt(args[0]) <=
  //       (await currency.getBalance(message.author.id)) &&
  //     (args[1].toLowerCase() == "tails" ||
  //       args[1].toLowerCase() == "heads")) ||
  //   (parseInt(args[0]) == 1 &&
  //     (await currency.getBalance(message.author.id)) <= 0 &&
  //     (args[1].toLowerCase() == "tails" ||
  //       args[1].toLowerCase() == "heads"))
  // ) {
  //   coinflip.flip(
  //     message,
  //     currency,
  //     parseInt(args[0]),
  //     args[1].toLowerCase()
  //   );
  // } else if (
  //   (parseInt(args[1]) > 0 &&
  //     parseInt(args[1]) <=
  //       (await currency.getBalance(message.author.id)) &&
  //     (args[0].toLowerCase() == "tails" ||
  //       args[0].toLowerCase() == "heads")) ||
  //   (parseInt(args[1]) == 1 &&
  //     (await currency.getBalance(message.author.id)) <= 0 &&
  //     (args[0].toLowerCase() == "tails" ||
  //       args[0].toLowerCase() == "heads"))
  


  let coins = await Coins.findAll();
  if (coins.length == 0) {
    await Coins.create({cointype: "heads", amount: 0});
    await Coins.create({cointype: "tails", amount: 0});
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
    (headsOrTails == "heads" && rand < 0.5) ||
    (headsOrTails == "tails" && rand >= 0.5)
  ) {
    currency.add(message.author.id, bet);
    console.log(`${message.author.username} won: ${bet}`);
    message.channel.send({
      embeds: [
        new Discord.MessageEmbed()
          .setColor("#AFEC28")
          .setAuthor({ name: "Yep Coinflip" })
          .setThumbnail("https://i.imgur.com/Ol3ZXQV.png")
          .addField(
            `${headsOrTails.toUpperCase()}`,
            `${message.author} won: \`${bet}\``
          )
          .setFooter({ text: `Tails: ${coins.tails}, Heads: ${coins.heads}.` }),
      ],
    });
  } else {
    currency.add(message.author.id, -bet);
    console.log(`${message.author.username} lost: ${bet}`);
    message.channel.send({
      embeds: [
        new Discord.MessageEmbed()
          .setColor("#A00000")
          .setAuthor({ name: "Yep Coinflip" })
          .setThumbnail("https://i.imgur.com/Ol3ZXQV.png")
          .addField(
            `${headsOrTails == "heads" ? "TAILS" : "HEADS"}`,
            `${message.author} lost: \`${bet}\``
          )
          .setFooter({ text: `Tails: ${coins.tails}, Heads: ${coins.heads}.` }),
      ],
    });
  }
};
