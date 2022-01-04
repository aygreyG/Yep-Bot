const { Cards } = require("./cards.json");
const Discord = require("discord.js");
const { prefix } = require("./config.json");

/* 312db 6 decknél
2 3 4 5 6 7 8 9 10 J Q K (10) A (1 v 11)
*/

// all of the cards
const CardNumber = 52;
// max number of one card (how many decks are used)
const MaxCard = 2;

const servers = [];

// Classes ----------------------------------------------------------------

class Player {
  constructor(name, id) {
    this.id = id;
    this.name = name;
    this.card = [];
    this.done = false;
    this.doneReason = "";
  }

  get cardVal() {
    return this.calcCardVal();
  }

  /**
   * @returns value of the player's cards
   */
  calcCardVal() {
    let val = 0;
    this.card.forEach((card) => {
      val += Cards[card].value;
    });

    if (
      val > 21 &&
      (this.card.includes(49) ||
        this.card.includes(50) ||
        this.card.includes(51) ||
        this.card.includes(48))
    ) {
      this.card.forEach((card) => {
        if (Cards[card].value == 11) {
          val -= 10;
        }
        if (val <= 21) return val;
      });
    }

    return val;
  }

  get writeCards() {
    return this.calcWriteCards();
  }

  /**
   * @returns a string representation of the player's cards
   */
  calcWriteCards() {
    let string = "";
    this.card.forEach((card) => {
      if (!(this.card.indexOf(card) == this.card.length - 1)) {
        string = string + Cards[card].name + " & ";
      } else {
        string += Cards[card].name;
      }
    });
    return string;
  }

  get valueCheck() {
    return this.calcValueCheck();
  }

  /**
   * 0 == bust
   * 1 == ok
   * 2 == blackjack
   * @returns a number from 0 to 2 depending on the cards' value
   */
  calcValueCheck() {
    let val = 0;
    this.card.forEach((card) => {
      val += Cards[card].value;
    });
    if (val == 21 && this.card.length == 2) {
      return 2;
    }
    if (val <= 21) return 1;
    if (
      val > 21 &&
      (this.card.includes(49) ||
        this.card.includes(50) ||
        this.card.includes(51) ||
        this.card.includes(48))
    ) {
      for (const card of this.card) {
        if (Cards[card].value === 11) {
          val -= 10;
          if (val <= 21) {
            return 1;
          }
        }
      }
    }
    return 0;
  }
}

class BlackjackGame {
  constructor(guildid) {
    this.guildid = guildid;
    this.players = [];
    this.arr = new Array(CardNumber);
    this.arr.fill(MaxCard);
    this.dealer = new Player("Yep Bot (the dealer)", "863025630261411881");
  }

  get tableEmbed() {
    return this.calcTableEmbed();
  }

  /**
   *
   * @returns a Discord embed object of the table
   */
  calcTableEmbed() {
    const embed = new Discord.MessageEmbed()
      .setColor("#000000")
      .setAuthor({ name: "Yep BlackJack" })
      .addField("\u200b", "\u200b")
      .addField(
        `__${this.dealer.name}__`,
        this.dealer.done
          ? this.dealer.doneReason == ""
            ? `**Cards:**  ${this.dealer.writeCards}\n**Value:**  \`${this.dealer.cardVal}\``
            : `**Cards:**  ${this.dealer.writeCards}\n**Value:**  \`${this.dealer.cardVal}\`\n\`${this.dealer.doneReason}\``
          : `**Cards:**  ${
              Cards[this.dealer.card[0]].name
            } & Something\n**Value:**  \`${Cards[this.dealer.card[0]].value}\``
      )
      .setThumbnail(
        "https://www.seekpng.com/png/full/819-8194226_blackjack-instant-game-logo-graphic-design.png"
      );

    for (const player of this.players) {
      if (player.done && player != this.dealer) {
        embed.addField(
          "\u200b",
          `__<@${player.id}>__\n*bet: ${player.bet}*` +
            "\n**Cards:**  " +
            player.writeCards +
            `\n\`${player.doneReason}\``,
          true
        );
      } else if (player != this.dealer) {
        embed.addField(
          "\u200b",
          `__<@${player.id}>__\n*bet: ${player.bet}*` +
            "\n**Cards:**  " +
            player.writeCards +
            "\n**Value:**  " +
            `\`${player.cardVal}\``,
          true
        );
      }
    }

    return embed;
  }

  get dealerGet() {
    return this.calcDealerGet();
  }

  /**
   * Gives the dealer cards
   * @returns if the dealer busts or its cards' value reaches 17
   */
  calcDealerGet() {
    while (this.dealer.valueCheck === 1) {
      console.log("Dealerget runs...");
      // összeszámolja az értékeket
      let dealerValue = 0;
      this.dealer.card.forEach((card) => {
        dealerValue += Cards[card].value;
      });
      // ha nagyobb 16-nál és 21-nél kisebb/egyenlő akkor leáll mert megfelelő
      if (dealerValue > 16 && dealerValue <= 21) {
        return;
      }
      // ha kisebb mint 16 akkor kap kártyát mert nagyobbnak kell lennie
      else if (dealerValue <= 16) {
        giveCard(this, this.dealer, 1);
      }
      // ha nagyobb 21-nél és van ace kártyája --> kivonja az értéket és ha kell ad még kártyát, vagy visszatér
      else if (
        dealerValue > 21 &&
        (this.dealer.card.includes(49) ||
          this.dealer.card.includes(50) ||
          this.dealer.card.includes(51) ||
          this.dealer.card.includes(48))
      ) {
        // i hate Array.forEach 🙂 for of is way better
        for (const card of this.dealer.card) {
          if (Cards[card].value == 11) {
            dealerValue -= 10;
            if (dealerValue <= 21) {
              if (dealerValue > 16) {
                return;
              } else {
                giveCard(this, this.dealer, 1);
                break;
              }
            }
          }
        }
      }
    }
  }
}

// Classes end ------------------------------------------------------------

const checkPlayer = async (b, channel, player, currency) => {
  return new Promise((resolve, reject) => {
    switch (player.valueCheck) {
      case 0:
        console.log(`${player.name} busted and lost: ${player.bet}`);
        player.done = true;
        player.doneReason = "BUSTED!";
        resolve(true);
        break;
      case 1:
        channel.send({ embeds: [b.tableEmbed] });
        resolve(hitorStand(b, channel, player, currency));
        break;
      case 2:
        console.log("Can't get here!");
        resolve(true);
        break;
      default:
        console.log("something badbad happened Sadge");
        resolve("idk what happened");
        break;
    }
  });
};

const giveCard = (b, player, cNum) => {
  // console.log(b.arr);
  let a = cNum;

  while (a !== 0) {
    const rand = Math.floor(Math.random() * 52);
    // console.log(rand);
    if (rand != 52 && b.arr[rand] > 0) {
      // console.log(rand);
      b.arr[rand]--;
      a--;
      player.card.push(rand);
    }
  }
};

const hitorStand = async (b, channel, player, currency) => {
  const hitembed = new Discord.MessageEmbed()
    .setColor("BLURPLE")
    .setDescription(
      `<@${player.id}> react with: ⬇️ if you want to stand, ⬆️ if you want to hit!`
    );

  const msg = await channel.send({ embeds: [hitembed] });
  await msg.react("⬇️");
  await msg.react("⬆️");

  const filter = (reaction, user) => {
    return (
      (reaction.emoji.name === "⬇️" || reaction.emoji.name === "⬆️") &&
      user.id == player.id &&
      !user.bot
    );
  };

  let ended = true;

  await msg
    .awaitReactions({ filter: filter, max: 1, time: 10000, errors: ["time"] })
    .then((collected) => {
      if (collected.first().emoji.name === "⬇️") {
        const standEmbed = new Discord.MessageEmbed()
          .setColor("GREY")
          .setDescription(`<@${player.id}> STANDS!`);

        console.log(`${player.name} stands.`);

        channel.send({ embeds: [standEmbed] });
        msg.delete().catch(console.error);
      }
      if (collected.first().emoji.name === "⬆️") {
        const hitEmbed = new Discord.MessageEmbed()
          .setColor("GREY")
          .setDescription(`<@${player.id}> HITS!`);

        console.log(`${player.name} hits.`);

        channel.send({ embeds: [hitEmbed] });
        giveCard(b, player, 1);

        msg.delete().catch(console.error);
        ended = false;
      }
    })
    .catch(() => {
      console.log(`${player.name} ran out of time kek`);

      const timeEmbed = new Discord.MessageEmbed()
        .setColor("RED")
        .setDescription(`<@${player.id}> ran out of time (they stand)!`);

      channel.send({ embeds: [timeEmbed] });
      msg.delete().catch(console.error);
    });

  if (!ended) {
    await checkPlayer(b, channel, player, currency);
  }

  return true;
};

const hitStart = async (b, channel, player, currency) => {
  const bool = await hitorStand(b, channel, player, currency);
  return new Promise((resolve) => {
    resolve(bool);
  });
};

const delay = (n) => new Promise((r) => setTimeout(r, n * 1000));

const bet = async (player, channel, currency) => {
  const indebt = currency.getBalance(player.id) <= 0;
  let string =
    `<@${player.id}> ` +
    "Give me a bet😠👇NOW! with '" +
    prefix +
    "bet <amount>'" +
    ` You currently have: ${currency.getBalance(
      player.id
    )}, if you bet more than you have then it won't do anything!`;
  if (indebt) {
    string = `<@${player.id}> you don't have money, so you can only bet 1, with \`${prefix}bet 1\`!`;
  }
  const betEmbed = new Discord.MessageEmbed()
    .setColor("DARK_GOLD")
    .setDescription(string);
  const ms = await channel.send({ embeds: [betEmbed] });

  return new Promise((resolve) => {
    const filter = (m) => {
      return (
        m.content.startsWith(`${prefix}bet`) &&
        m.author.id === player.id &&
        ((parseInt(m.content.slice(4).trim()) <=
          currency.getBalance(player.id) &&
          parseInt(m.content.slice(4).trim()) > 0) ||
          (parseInt(m.content.slice(4).trim()) == 1 && indebt))
      );
    };

    const collector = channel.createMessageCollector({
      filter: filter,
      max: 1,
      time: 10000,
    });

    collector.on("collect", (mess) => {
      player.bet = parseInt(mess.content.slice(4).trim());
      currency.add(player.id, -player.bet);
      console.log(`${player.name}'s bet: ${player.bet}`);

      const betreply = new Discord.MessageEmbed()
        .setColor("DARK_GOLD")
        .setDescription(`<@${player.id}> your bet: ${player.bet}`);

      mess.channel.send({ embeds: [betreply] });
    });

    collector.on("end", (collected, reason) => {
      if (reason === "time") {
        const removeEmbed = new Discord.MessageEmbed()
          .setColor("RED")
          .setDescription(
            `<@${player.id}> got removed because of no response!`
          );
        channel.send({ embeds: [removeEmbed] }).then(async (message) => {
          await delay(3);
          message.delete().catch(console.error);
        });
        console.log(`${player.name} got removed: time`);
        player.done = true;
        player.doneReason = "time";
      }
      ms.delete().catch(console.error);
      resolve();
    });
  });
};

const start = (message, currency) => {
  // console.log(servers);
  const b = new BlackjackGame(message.guild.id);
  if (servers.includes(message.guild.id)) {
    message.channel.send({
      embeds: [
        new Discord.MessageEmbed()
          .setColor("RED")
          .setDescription("There is a game already in this server!"),
      ],
    });
    return;
  }
  servers.push(message.guild.id);

  const startEmbed = new Discord.MessageEmbed()
    .setColor("#BFF2A0")
    .setDescription(
      `${message.author} started blackjack, join by clicking ✅ under the message, u have 10 secs!!!`
    );

  message.channel.send({ embeds: [startEmbed] }).then((m) => {
    m.react("✅");
    const rfilter = (reaction, user) => {
      return (
        !b.players.includes(user.id) &&
        reaction.emoji.name === "✅" &&
        !user.bot
      );
    };
    const rcollector = m.createReactionCollector({
      filter: rfilter,
      time: 10000,
    });

    rcollector.on("collect", (reaction, user) => {
      let has = false;
      b.players.forEach((player) => {
        if (player.id == user.id) {
          has = true;
        }
      });
      if (!has) {
        const joinEmbed = new Discord.MessageEmbed()
          .setColor("GREEN")
          .setDescription(`${user} joined!`);

        console.log(`${user.username} joined!`);
        b.players.push(new Player(user.username, user.id));

        m.channel.send({ embeds: [joinEmbed] }).then(async (joinmes) => {
          await delay(1);
          joinmes.delete().catch(console.error);
        });
      }
    });

    rcollector.on("end", async (collected) => {
      console.log(`Joined: ${collected.size}`);
      if (collected.size == 0) {
        const notEnoughPlayersEmbed = new Discord.MessageEmbed()
          .setColor("RED")
          .setDescription("No players joined");

        m.channel.send({ embeds: [notEnoughPlayersEmbed] });
        servers.splice(servers.indexOf(b), 1);
        return;
      }

      const mchannel = m.channel;

      for (const player of b.players) {
        await bet(player, mchannel, currency);
      }

      b.players = b.players.filter((player) => !player.done);

      if (b.players.length > 0) {
        b.players.push(b.dealer);
        b.players.forEach((player) => {
          giveCard(b, player, 2);
        });
        mchannel.send({ embeds: [b.tableEmbed] });

        if (b.dealer.valueCheck === 2) {
          b.players.forEach((player) => {
            if (player.valueCheck === 2 && player != b.dealer) {
              player.done = true;
              player.doneReason = "Pushed!";
              currency.add(player.id, player.bet);
            } else if (player != b.dealer) {
              player.done = true;
              player.doneReason = "Lost!";
            } else {
              player.done = true;
              player.doneReason = "Got BlackJack!";
            }
          });
          mchannel.send({ embeds: [b.tableEmbed] });
        } else {
          for (const player of b.players) {
            if (player != b.dealer) {
              if (player.valueCheck == 2) {
                console.log(
                  `${player.name} got a blackjack and won: ${Math.ceil(
                    player.bet * 1.5
                  )}`
                );
                currency.add(
                  player.id,
                  player.bet + Math.ceil(player.bet * 1.5)
                );
                player.done = true;
                player.doneReason = "BLACKJACK!";
              } else {
                const worked = await hitStart(b, mchannel, player, currency);
              }
            }
          }

          mchannel.send({ embeds: [b.tableEmbed] });

          const playersfiltered = b.players.filter((player) => !player.done);

          if (playersfiltered.length > 1) {
            b.dealerGet;
            if (b.dealer.cardVal > 21) {
              b.dealer.done = true;
              b.dealer.doneReason = "BUSTED!";
              b.players.forEach((player) => {
                if (player != b.dealer && !player.done) {
                  player.done = true;
                  player.doneReason = "WON";
                  currency.add(player.id, player.bet * 2);
                }
              });
            } else {
              b.dealer.done = true;
              b.dealer.doneReason = "";
              b.players.forEach((player) => {
                if (player != b.dealer && !player.done) {
                  if (player.cardVal > b.dealer.cardVal) {
                    player.done = true;
                    player.doneReason = "WON!";
                    currency.add(player.id, player.bet * 2);
                  } else if (player.cardVal == b.dealer.cardVal) {
                    player.done = true;
                    player.doneReason = "PUSHED!";
                    currency.add(player.id, player.bet);
                  } else {
                    player.done = true;
                    player.doneReason = "LOST";
                  }
                }
              });
            }
            mchannel.send({ embeds: [b.tableEmbed] });
            let table = "";
            b.players.forEach((player) => {
              if (player != b.dealer) {
                table += `${player.name} ${player.doneReason} bet: ${player.bet}, `;
              } else {
                table += `${player.name} ${player.doneReason}`;
              }
            });
            console.log(table);
          }
        }
      }
      servers.splice(servers.indexOf(b), 1);
    });
  });
};

module.exports = { start };
