const { Cards } = require('./cards.json');
/* 312db 6 deck
4*13*6
2 3 4 5 6 7 8 9 10 J Q K (10) A (1 v 11)
*/
const CardNumber = 52;
const MaxCard = 1;
let Blackjack = false;
const arr = new Array(CardNumber);
let players = [];


class Player {
    constructor(name, id) {
        this.id = id;
        this.name = name;
        this.card = [];
        this.done = false;
    }
    
    get cardVal() {
        return this.calcCardVal();
    }
    
    calcCardVal() {
        let val = 0;
        this.card.forEach(card => {
            val += Cards[card].value;
        });
        
        if (val > 21 && (this.card.includes(49) || this.card.includes(50) 
        || this.card.includes(51) || this.card.includes(48))) {
            this.card.forEach(card => {
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
    
    calcWriteCards() {
        let string = '';
        this.card.forEach(card => {
            if (!(this.card.indexOf(card) == this.card.length - 1)) {
                string = string + Cards[card].name + ' & ';
            }
            else {
                string += Cards[card].name;
            }
        });
        return string;
    }
}

const dealer = new Player('Yep Cock', '863025630261411881');

const valueCheck = (player) => {
    // 0 == bust
    // 1 == ok
    // 2 == blackjack
    let val = 0;
    player.card.forEach(card => {
        val += Cards[card].value;
    });
    // console.log(val + ' a valuecheck1');
    if (val == 21 && player.card.length == 2) {
        return 2;
    }
    if (val <= 21) return 1;
    if (val > 21 && (player.card.includes(49) || player.card.includes(50) 
    || player.card.includes(51) || player.card.includes(48))) {
        for (const card of player.card) {
            if (Cards[card].value === 11) {
                val -= 10;
                if (val <= 21) {
                    // console.log('eljut ide ' + val);
                    return 1;
                }
            }
        }
    }
    // console.log(val + ' a valuecheck2');
    return 0;
};

const checkPlayer = async (channel, player, currency) => {
    return new Promise((resolve, reject) => {
            switch(valueCheck(player)) {
            case 0:
                console.log(`${player.name} busted and lost: ${player.bet}`);
                channel.send(`<@${player.id}> busted and lost: ${player.bet}`);
                players.splice(players.indexOf(player), 1);
                resolve(true);
                break;
            case 1:
                console.log(`${player.name}: hit or stand`);
                resolve(hitorStand(channel, player, currency));
                break;
            case 2:
                console.log('Can\'t get here!');
                resolve(true);
                break;
            default:
                console.log('something badbad happened Sadge');
                resolve('idk what happened');
                break;
        }
    });
};

const giveCard = (player, cNum) => {
    let a = cNum;
    // if (player.id == '107398653542400000' && cNum == 1) {
    //     player.card.push(50);
    //     a = 0;
    // }
    // if (player.id == '107398653542400000' && cNum == 2) {
    //     player.card.push(5);
    //     player.card.push(34);
    //     a = 0;
    // }
    while (a !== 0) {
        const rand = Math.floor(Math.random() * 52);
        if (rand === 52) {
            continue;
        }
        if (arr[rand] > 0) {
            arr[rand]--;
            a--;
            player.card.push(rand);
        }
    }
};

const hitorStand = async (channel, player, currency) => {
    const msg = await channel.send(`<@${player.id}> react with: ⬇️ if you want to stand, ⬆️ if you want to hit!`);
    await msg.react('⬇️');
    await msg.react('⬆️');

    const filter = (reaction, user) => {
        return ((reaction.emoji.name === '⬇️' || reaction.emoji.name === '⬆️')
        && user.id == player.id && !user.bot);
    };

    let ended = true;

    await msg.awaitReactions(filter, { max: 1, time: 10000, errors: ['time'] })
    .then(collected => {
        if (collected.first().emoji.name === '⬇️') {
            channel.send('You stand');
            msg.delete().catch(console.error);
        }
        if (collected.first().emoji.name === '⬆️') {
            channel.send('You hit!');
            giveCard(player, 1);
            channel.send(`<@${player.id}> your cards: ${player.writeCards} value: ${player.cardVal}`);
            msg.delete().catch(console.error);
            ended = false;
        }
    }).catch(() => {
        console.log('ran out of time kek');
        channel.send('You ran out of time so you stand!');
        msg.delete().catch(console.error);
    });

    if (!ended) {
        await checkPlayer(channel, player, currency);
    }

    return true;
    // channel.send(`<@${player.id}> react with: ⬇️ if you want to stand, ⬆️ if you want to hit!`)
    // .then(message => {
    //     message.react('⬇️')
    //     .then(() => message.react('⬆️'))
    //     .then(async () => {
    //         const filter = (reaction, user) => {
    //             return ((reaction.emoji.name === '⬇️' || reaction.emoji.name === '⬆️') 
    //             && user.id == player.id && !user.bot);
    //         };

            /* message.awaitReactions(filter, { max: 4, time: 60000, errors: ['time'] })
	        .then(collected => console.log(collected.size))
	        .catch(collected => {
	        	console.log(`After a minute, only ${collected.size} out of 4 reacted.`);
	        }); */

            // await message.awaitReactions(filter, { max: 1, time: 10000, errors: ['time'] })
            // .then(async collected => {
            //     if (collected.first().emoji.name === '⬇️') {
            //         channel.send('You stand');
            //         message.delete().catch(console.error);
            //         return true;
            //     }
            //     if (collected.first().emoji.name === '⬆️') {
            //         channel.send('You hit!');
            //         giveCard(player, 1);
            //         message.delete().catch(console.error);
            //         return await checkPlayer(channel, player);
            //     }
            // }).catch(async () => {
            //     console.log('ran out of time kek');
            //     channel.send('You ran out of time so you stand!');
            //     message.delete().catch(console.error);
            //     return true;
            // });

            // const collector = message.createReactionCollector(filter, { max: 1, time: 10000 });

            // collector.on('collect', reaction => {
            //     if (reaction.emoji.name === '⬆️') {
            //         giveCard(player, 1);
            //         channel.send('You hit!');
            //         return true;
            //     }
            //     if (reaction.emoji.name === '⬇️') {
            //         channel.send('You stand');
            //         return false;
            //     }
            // });

            // collector.on('end', reason => {
            //     if (reason === 'time') {
            //         channel.send('Not reacted in time! So you stand!');
            //         message.delete();
            //         return false;
            //     }
            // });
    //     });
    // })
    // .catch(error => {
    //     console.log(error.message);
    // });
};

const hitStart = async (channel, player, currency) => {
    const bool = await hitorStand(channel, player, currency); 
    return new Promise((resolve) => {
        resolve(bool);
    });
};

const test = () => {
    Cards.forEach(element => {
        console.log(Cards.indexOf(element));
    });
};

const dealerGet = () => {
    while (valueCheck(dealer) === 1) {
        let dealerValue = 0;
        dealer.card.forEach(card => {
            dealerValue += Cards[card].value;
        });

        if (dealerValue > 16 && dealerValue <= 21) {
            // console.log(dealerValue + ' returned');
            return;
        }
        else if(dealerValue <= 16) {
            giveCard(dealer, 1);
            // console.log(dealerValue + ' gets a card');
        }
        else if (dealerValue > 21 && (dealer.card.includes(49) || dealer.card.includes(50) 
        || dealer.card.includes(51) || dealer.card.includes(48))) {
            dealer.card.forEach(card => {
                if (Cards[card].value == 11) {
                    dealerValue -= 10;
                    if (dealerValue < 21) {
                        if (dealerValue > 16) {
                            // console.log(dealerValue + ' returned2');
                            return;
                        }
                        else {
                            // console.log(dealerValue + ' gets a card2');
                            giveCard(dealer, 1);
                        }
                    }
                }
            });
        }
    }
};

const bet = (player, channel, currency) => {
    return new Promise((resolve) => {
        const ms = channel.send(`> <@${player.id}> ` + 'Give me a bet😠👇NOW! with \'-bet <amount>\'' +
        ` You currently have: ${currency.getBalance(player.id)}, if you bet more than you have then it won't do anything!`);

        const filter = m => {
            return m.content.startsWith('-bet') && m.author.id === player.id
            && parseInt(m.content.slice(4).trim()) <= currency.getBalance(player.id) && parseInt(m.content.slice(4).trim()) > 0;
        };

        const collector = channel.createMessageCollector(filter, { max: 1, time: 10000 });

        collector.on('collect', mess => {
            player.bet = parseInt(mess.content.slice(4).trim());
            currency.add(player.id, -player.bet);
            console.log(`${player.name}: ${player.bet}`);
            mess.reply(`your bet: ${player.bet}`);
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                channel.send(`<@${player.id}> got removed because of no response!`);
                console.log(`${player.name} got removed: time`);
                players.splice(players.indexOf(player), 1);
            }
            // console.log('collected bet: ' + collected.size + ' ' + reason);
            resolve();
        });
    });
};

const start = (message, currency) => {
    if (Blackjack) {
        message.channel.send('There is already a game!');
        return;
    }
    Blackjack = true;
    // players.push(message.author.id);
    message.channel.send(`> ${message.author} started blackjack, join by clicking ✅ under the message, u have 5 secs!!!`)
    .then(m => {
        m.react('✅');
        const rfilter = (reaction, user) => !players.includes(user.id) && reaction.emoji.name === '✅' && !user.bot;
        const rcollector = m.createReactionCollector(rfilter, { time: 5000 });

        rcollector.on('collect', (reaction, user) => {
            let has = false;
            players.forEach(player => {
                if (player.id == user.id) {
                    has = true;
                }
            });
            if (!has) {
                console.log(`${user.username} joined!`);
                m.channel.send(`${user} joined!`);
                players.push(new Player(user.username, user.id));
            }
        });

        rcollector.on('end', async collected => {
            console.log(`Joined: ${collected.size}`);
            for (const player of players) {
                await bet(player, m.channel, currency);
            }

            if (players.length > 0) {
                deckReset();
                players.push(dealer);
                players.forEach(player => {
                    giveCard(player, 2);
                    m.channel.send(`<@${player.id}> got: ${Cards[player.card[0]].name} & ${
                        Cards[player.card[1]].name} value: ${Cards[player.card[0]].value + Cards[player.card[1]].value}`);
                });
                
                if (valueCheck(dealer) === 2) {
                    players.forEach(player => {
                        if (valueCheck(player) === 2) {
                            m.channel.send(`<@${player.id}> pushed and got their money back.`);
                            currency.add(player.id, player.bet);
                        }
                        else {
                            m.channel.send(`<@${player.id}> lost their bet: ${player.bet}`);
                        }
                    });
                }
                else {
                    for (const player of players) {
                        // console.log(player.cardVal);
                        if (player != dealer) {
                            if (valueCheck(player) == 2) {
                                console.log(`${player.name} got a blackjack and won: ${Math.ceil(player.bet * 1.5)}`);
                                currency.add(player.id, player.bet + Math.ceil(player.bet * 1.5));
                                m.channel.send(`<@${player.id}> got a blackjack and won: ${Math.ceil(player.bet * 1.5)}`);
                                player.done = true;
                            }
                            else {
                                const worked = await hitStart(m.channel, player, currency); // checkPlayer(m.channel, player);
                                // console.log(worked);
                            }
                        }
                    }

                    players = players.filter(player => !player.done);

                    if (players.length > 1) {
                        dealerGet();
                        m.channel.send(`Dealer's cards: ${dealer.writeCards} value: ${dealer.cardVal}`);
                        if (dealer.cardVal > 21) {
                            m.channel.send('Dealer busted, everyone wins!!!');
                            players.forEach(player => {
                                if (player != dealer) {
                                    currency.add(player.id, player.bet * 2);
                                }
                            });
                        }
                        else {
                            players.forEach(player => {
                                if (player != dealer && !player.blackjack) {
                                    if (player.cardVal > dealer.cardVal) {
                                        m.channel.send(`<@${player.id}> won: ${player.bet}`);
                                        currency.add(player.id, player.bet * 2);
                                    }
                                    else if (player.cardVal == dealer.cardVal) {
                                        m.channel.send(`<@${player.id}> pushed and got their money back. (${player.bet})`);
                                        currency.add(player.id, player.bet);
                                    }
                                    else {
                                        m.channel.send(`<@${player.id}> lost: ${player.bet}`);
                                    }
                                }
                            });
                        }
                    }
                }
            }
            Blackjack = false;
            players.length = 0;
            dealer.card.length = 0;
        });
    // })
    // .then(m => {
    //     if (players.length > 0) {
    //         deal(m.channel, currency);
    //     }
    });
    // const filter = m => /* !players.includes(m.author.id) && */ m.content === '-b join' && !m.author.bot;
    // const collector = message.channel.createMessageCollector(filter, { time: 15000 });
    // // message.channel.send('-blackjack join');

    // collector.on('collect', m => {
    //     if (players.includes(m.author.id)) {
    //         m.reply('you have already joined!');
    //         return;
    //     }
    //     console.log(`joined: ${m.author}`);
    //     players.push(m.author.id);
    //     m.reply('you joined!');
    // });

    // collector.on('dispose', m => {
    //     console.log('disposed');
        
    // });

    // collector.on('end', collected => {
    //     console.log(`Collected: ${collected.size}`);
    // });
};

// const join = (message) => {
//     if (players.includes(message.author.id)) {
//         message.channel.send('You have already joined!');
//     }
//     else {
//         players.push(message.author.id);
//         message.reply('you joined!');
//     }
// };

// const deal = (number) => {
// 	const nums = new Array(number);
//     let have = 0;
//     while(have != number) {
//         const rando = Math.floor(Math.random() * (CardNumber - 0.001));
//         console.log(`${have} ${number} ${rando} ${arr[rando]}`);
//         if (arr[rando] > 0) {
//             nums[have] = rando;
//             have++;
//             arr[rando]--;
//         }
//     }
//     return nums;
// };

const deckReset = () => {
    arr.fill(MaxCard);
};

module.exports = { test, start };