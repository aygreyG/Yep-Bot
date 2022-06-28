const { Cards } = require("../constants/cards.json");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const Player = require("./BlackjackPlayer");
const { prefix } = require("../config.json");
const BetCollector = require("../utils/BetCollector");

// all of the cards
const CardNumber = 52;
// max number of one card (how many decks are used)
const MaxCard = 2;

const delay = (n) => new Promise((r) => setTimeout(r, n * 1000));

module.exports = class BlackjackGame {
  constructor(interaction, client) {
    this.client = client;
    this.interaction = interaction;
    this.currency = client.currency;
    this.guildid = interaction.guildId;
    this.channel = interaction.channel;
    this.players = [];
    this.arr = new Array(CardNumber);
    this.arr.fill(MaxCard);
    this.dealer = new Player(
      `${client.user.username} (the dealer)`,
      client.user.id
    );
    this.tableMessage = undefined;
    this.start(interaction);
  }

  async start(interaction) {
    const startEmbed = new MessageEmbed()
      .setColor("#BFF2A0")
      .setDescription(
        `${interaction.member} started blackjack, join by clicking the \`JOIN\` button, u have 10 seconds!!!`
      );

    const actionrow = new MessageActionRow().addComponents([
      new MessageButton()
        .setCustomId("join")
        .setLabel("JOIN")
        .setStyle("SUCCESS"),
    ]);

    const startmessage = await this.channel.send({
      embeds: [startEmbed],
      components: [actionrow],
    });

    const collector = startmessage.createMessageComponentCollector({
      componentType: "BUTTON",
      time: 10250,
    });

    collector.on("collect", (i) => {
      let has = false;
      this.players.forEach((player) => {
        if (player.id == i.user.id) {
          has = true;
        }
      });

      if (!has) {
        const joinEmbed = new MessageEmbed()
          .setColor("GREEN")
          .setDescription(`${i.user} joined!`);

        // console.log(`${i.user.username} joined!`);
        this.players.push(new Player(i.user.username, i.user.id));

        i.reply({ embeds: [joinEmbed] }).then(async (rep) => {
          await delay(1);
          i.deleteReply();
        });
      } else {
        i.reply({
          embeds: [
            new MessageEmbed()
              .setColor("RED")
              .setDescription("You already joined!"),
          ],
          ephemeral: true,
        });
      }
    });

    collector.on("end", async (collected) => {
      actionrow.components.forEach((component) => component.setDisabled(true));
      startmessage.edit({ components: [actionrow] });

      console.log(
        `Joined to blackjack game in ${this.guildid}: ${collected.size}`
      );
      if (collected.size == 0) {
        const notEnoughPlayersEmbed = new MessageEmbed()
          .setColor("RED")
          .setDescription("No players joined");

        startmessage.channel.send({ embeds: [notEnoughPlayersEmbed] });
        this.client.blackjackGames.delete(this.guildid);
        return;
      }

      for (const player of this.players) {
        await this.betStart(player);
      }

      this.players = this.players.filter((player) => !player.done);

      if (this.players.length > 0) {
        this.players.push(this.dealer);
        this.players.forEach((player) => {
          this.giveCard(player, 2);
        });

        if (this.tableMessage) {
          this.tableMessage.edit({ embeds: [this.tableEmbed] });
        } else {
          this.tableMessage = await this.channel.send({
            embeds: [this.tableEmbed],
          });
        }

        if (this.dealer.valueCheck === 2) {
          this.players.forEach((player) => {
            if (player.valueCheck === 2 && player != this.dealer) {
              player.done = true;
              player.doneReason = "Pushed!";
              this.currency.add(player.id, player.bet);
            } else if (player != this.dealer) {
              player.done = true;
              player.doneReason = "Lost!";
            } else {
              player.done = true;
              player.doneReason = "Got BlackJack!";
            }
          });
          this.tableMessage.edit({ embeds: [this.tableEmbed] });
        } else {
          for (const player of this.players) {
            if (player != this.dealer) {
              if (player.valueCheck == 2) {
                console.log(
                  `${player.name} got a blackjack and won: ${Math.ceil(
                    player.bet * 1.5
                  )}`
                );
                this.currency.add(
                  player.id,
                  player.bet + Math.ceil(player.bet * 1.5)
                );
                player.done = true;
                player.doneReason = "BLACKJACK!";
              } else {
                await this.hitStart(player);
              }
            }
          }

          this.tableMessage.edit({ embeds: [this.tableEmbed] });
          const playersfiltered = this.players.filter((player) => !player.done);

          if (playersfiltered.length > 1) {
            this.dealerGet();
            if (this.dealer.cardVal > 21) {
              this.dealer.done = true;
              this.dealer.doneReason = "BUSTED!";
              this.players.forEach((player) => {
                if (player != this.dealer && !player.done) {
                  player.done = true;
                  player.doneReason = "WON";
                  this.currency.add(player.id, player.bet * 2);
                }
              });
            } else {
              this.dealer.done = true;
              this.dealer.doneReason = "";
              this.players.forEach((player) => {
                if (player != this.dealer && !player.done) {
                  if (player.cardVal > this.dealer.cardVal) {
                    player.done = true;
                    player.doneReason = "WON!";
                    this.currency.add(player.id, player.bet * 2);
                  } else if (player.cardVal == this.dealer.cardVal) {
                    player.done = true;
                    player.doneReason = "PUSHED!";
                    this.currency.add(player.id, player.bet);
                  } else {
                    player.done = true;
                    player.doneReason = "LOST";
                  }
                }
              });
            }

            this.tableMessage.edit({ embeds: [this.tableEmbed] });

            let table = "";
            this.players.forEach((player) => {
              if (player != this.dealer) {
                table += `${player.name} ${player.doneReason} bet: ${player.bet}, `;
              } else {
                table += `${player.name} ${player.doneReason}`;
              }
            });
            console.log(table);
          }
        }
      }
      this.client.blackjackGames.delete(this.guildid);
    });
  }

  async betStart(player) {
    const money = await this.currency.getBalance(player.id);
    const indebt = money <= 0;
    let betString = `<@${player.id}> Give me a bet😠👇NOW!
      You can bet with the \`/bet\` command or \`${prefix}bet <amount>\`
      You currently have: ${money}!`;
    if (indebt) {
      betString = `<@${player.id}> you don't have money!
      You can only bet 1 with the \`/bet\` command or \`${prefix}bet 1\`!`;
    }
    const betEmbed = new MessageEmbed()
      .setColor("DARK_GOLD")
      .setDescription(betString);
    const msg = await this.channel.send({ embeds: [betEmbed] });

    this.betCollector = new BetCollector(player, money);
    await this.betCollector.start();

    if (this.betCollector.endReason == "Timeout") {
      player.done = true;
      player.doneReason = "Timed out";
      this.channel.send({
        embeds: [
          new MessageEmbed()
            .setColor("RED")
            .setDescription(`<@${player.id}> Time ran out to bet!`),
        ],
      });
    }

    this.betCollector = undefined;
    msg.delete().catch(console.error);
  }

  playerBet(interaction, amount) {
    if (
      !this.betCollector ||
      !this.betCollector.player.id == interaction.member.id
    ) {
      return new MessageEmbed()
        .setColor("RED")
        .setDescription("You can't bet now!");
    }

    if (amount < 1) {
      return new MessageEmbed().setColor("RED").setDescription("Really?! 😡");
    }

    if (
      this.betCollector.maxMoney < amount &&
      !(this.betCollector.maxMoney <= 0 && amount == 1)
    ) {
      return new MessageEmbed()
        .setColor("RED")
        .setDescription("You don't have enough!");
    }

    this.currency.add(this.betCollector.player.id, -amount);
    this.betCollector.player.bet = amount;
    this.betCollector.stop();
    return new MessageEmbed()
      .setColor("GREEN")
      .setDescription(`Your bet: ${amount}`);
  }

  get tableEmbed() {
    return this.calcTableEmbed();
  }

  /**
   *
   * @returns a Discord embed object of the table
   */
  calcTableEmbed() {
    let dealerString;

    if (this.dealer.done) {
      if (this.dealer.doneReason == "") {
        dealerString = `**Cards:**  ${this.dealer.writeCards}
        **Value:**  \`${this.dealer.cardVal}\``;
      } else {
        dealerString = `**Cards:**  ${this.dealer.writeCards}
        **Value:**  \`${this.dealer.cardVal}\`
        \`${this.dealer.doneReason}\``;
      }
    } else {
      dealerString = `**Cards:**  ${Cards[this.dealer.card[0]].name} & Something
      **Value:**  \`${Cards[this.dealer.card[0]].value}\``;
    }

    const embed = new MessageEmbed()
      .setColor("#000000")
      .setAuthor({ name: "Yep BlackJack" })
      .addField("\u200b", "\u200b")
      .addField(`__${this.dealer.name}__`, dealerString)
      .setThumbnail("https://cdn-icons-png.flaticon.com/512/1983/1983632.png");

    for (const player of this.players) {
      if (player.done && player != this.dealer) {
        embed.addField(
          "\u200b",
          `__<@${player.id}>__
          *bet: ${player.bet}*
          **Cards:**  ${player.writeCards}
          \`${player.doneReason}\``,
          true
        );
      } else if (player != this.dealer) {
        embed.addField(
          "\u200b",
          `__<@${player.id}>__
          *bet: ${player.bet}*
          **Cards:**  ${player.writeCards}
          **Value:** \`${player.cardVal}\``,
          true
        );
      }
    }

    return embed;
  }

  giveCard(player, numOfCards) {
    let remaining = numOfCards;

    while (remaining !== 0) {
      const rand = Math.floor(Math.random() * 52);
      if (rand != 52 && this.arr[rand] > 0) {
        this.arr[rand]--;
        remaining--;
        player.card.push(rand);
      }
    }
  }

  /**
   * Gives the dealer cards
   * @returns if the dealer busts or its cards' value reaches 17
   */
  dealerGet() {
    while (this.dealer.valueCheck === 1) {
      let dealerValue = 0;
      this.dealer.card.forEach((card) => {
        dealerValue += Cards[card].value;
      });
      // the value of the cards is greater than 16 and less than 21 --> returns
      if (dealerValue > 16 && dealerValue <= 21) {
        return;
      }
      // less than 16 --> gets a card
      if (dealerValue <= 16) {
        this.giveCard(this.dealer, 1);
      }
      // greater than 21 and has an ace --> -10 from the value and gets a card if needed
      if (
        !(
          dealerValue > 21 &&
          (this.dealer.card.includes(49) ||
            this.dealer.card.includes(50) ||
            this.dealer.card.includes(51) ||
            this.dealer.card.includes(48))
        )
      )
        return;

      for (const card of this.dealer.card) {
        if (Cards[card].value != 11) {
          continue;
        }

        dealerValue -= 10;
        if (dealerValue <= 21) {
          if (dealerValue > 16) {
            return;
          } else {
            this.giveCard(this.dealer, 1);
            break;
          }
        }
      }
    }
  }

  async hitStart(player) {
    const bool = await this.hitOrStand(player);
    return new Promise((resolve) => {
      resolve(bool);
    });
  }

  async hitOrStand(player) {
    const hitembed = new MessageEmbed()
      .setColor("BLURPLE")
      .setDescription(
        `<@${player.id}> react with: ⬇️ if you want to stand, ⬆️ if you want to hit!`
      );

    const msg = await this.channel.send({ embeds: [hitembed] });
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
          const standEmbed = new MessageEmbed()
            .setColor("GREY")
            .setDescription(`<@${player.id}> STANDS!`);

          // console.log(`${player.name} stands.`);

          this.channel.send({ embeds: [standEmbed] }).then(async (message) => {
            await delay(2);
            message.delete().catch(console.error);
          });

          msg.delete().catch(console.error);
        }
        if (collected.first().emoji.name === "⬆️") {
          const hitEmbed = new MessageEmbed()
            .setColor("GREY")
            .setDescription(`<@${player.id}> HITS!`);

          // console.log(`${player.name} hits.`);

          this.channel.send({ embeds: [hitEmbed] }).then(async (message) => {
            await delay(2);
            message.delete().catch(console.error);
          });

          this.giveCard(player, 1);

          msg.delete().catch(console.error);
          ended = false;
        }
      })
      .catch(() => {
        console.log(`${player.name} ran out of time kek`);

        const timeEmbed = new MessageEmbed()
          .setColor("RED")
          .setDescription(`<@${player.id}> ran out of time (they stand)!`);

        this.channel.send({ embeds: [timeEmbed] });
        msg.delete().catch(console.error);
      });

    if (!ended) {
      await this.checkPlayer(player);
    }

    return true;
  }

  async checkPlayer(player) {
    return new Promise((resolve, reject) => {
      switch (player.valueCheck) {
        case 0:
          console.log(`${player.name} busted and lost: ${player.bet}`);
          player.done = true;
          player.doneReason = "BUSTED!";
          resolve(true);
          break;
        case 1:
          this.tableMessage.edit({ embeds: [this.tableEmbed] });
          resolve(this.hitOrStand(player));
          break;
        case 2:
          console.log("Can't get here! (2)");
          resolve(true);
          break;
        default:
          console.log("Can't get here! (default)");
          resolve("...");
          break;
      }
    });
  }
};
