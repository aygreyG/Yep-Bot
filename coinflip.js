const Discord = require("discord.js");
const fs = require("fs");
const { promisify } = require("util");
const wait = promisify(setTimeout);
let coins;
try {
  coins = require("./coins.json");
} catch (err) {
  // console.error(err);
  fs.writeFile("./coins.json", "{\"tails\":0,\"heads\":0}", "utf8", () => console.log("New coins.json created."));
  coins = {heads: 0, tails: 0};
}

// -flip heads/tails <bet>
// -flip <bet> heads/tails

const logg = () => {
  console.log(coins.tails + " " + coins.heads);
};

const flip = (message, currency, bet, headsOrTails) => {
  // rand < 0.5 HEADS
  // rand >= 0.5 TAILS
  const rand = Math.random();

  if (rand < 0.5) {
    coins.heads++;
    fs.writeFile("./coins.json", JSON.stringify(coins), "utf8", logg);
  } else {
    coins.tails++;
    fs.writeFile("./coins.json", JSON.stringify(coins), "utf8", logg);
  }

  // ANTI BIAS TEST
  // let head = 0, tail = 0;
  // for (let i = 0; i < 10000; i++) {
  //     const rand = Math.random();
  //     if (rand < 0.5) head++;
  //     if (rand >= 0.5) tail++;
  // }
  // message.channel.send(head + ' ' + tail);

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
          .setAuthor("Yep Coinflip")
          // .attachFiles(['./fos.png'])
          .setThumbnail("https://i.imgur.com/Ol3ZXQV.png")
          .addField(
            `${headsOrTails.toUpperCase()}`,
            `${message.author} won: \`${bet}\``
          )
          .setFooter(`Tails: ${coins.tails}, Heads: ${coins.heads}.`),
      ],
    });
  } else {
    currency.add(message.author.id, -bet);
    console.log(`${message.author.username} lost: ${bet}`);
    message.channel.send({
      embeds: [
        new Discord.MessageEmbed()
          .setColor("#A00000")
          .setAuthor("Yep Coinflip")
          // .attachFiles(['./fos.png'])
          .setThumbnail("https://i.imgur.com/Ol3ZXQV.png")
          .addField(
            `${headsOrTails == "heads" ? "TAILS" : "HEADS"}`,
            `${message.author} lost: \`${bet}\``
          )
          .setFooter(`Tails: ${coins.tails}, Heads: ${coins.heads}.`),
      ],
    });
  }
};

module.exports = { flip };
