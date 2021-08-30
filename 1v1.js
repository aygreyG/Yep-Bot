const Discord = require('discord.js');
const { prefix } = require('./config.json');

class Game {
    constructor(bet, authorid, opponentid, currency) {
        this.bet = bet;
        this.rand = Math.floor(Math.random() * 100);
        this.authorid = authorid;
        this.opponentid = opponentid;
        this.currency = currency;
    }

    calcWinnerString(authornum, opponentnum) {
        if (Math.abs(authornum - this.rand) < Math.abs(opponentnum - this.rand)) {
            this.currency.add(this.authorid, this.bet);
            this.currency.add(this.opponentid, -this.bet);
            return `<@${this.authorid}> won: ${this.bet}, because the number was: ${this.rand}.`;
        }
        else if (Math.abs(authornum - this.rand) > Math.abs(opponentnum - this.rand)) {
            this.currency.add(this.opponentid, this.bet);
            this.currency.add(this.authorid, -this.bet);
            return `<@${this.opponentid}> won: ${this.bet}, because the number was: ${this.rand}.`;
        }
        else {
            return 'It is a draw, noone wins! Because the number was: ' + this.rand + '.';
        }
    }
}

const oneVOne = async (channel, currency, authorid, opponentid) => {
    if (currency.getBalance(authorid) <= 0 || currency.getBalance(opponentid) <= 0) {
        channel.send({embeds:[new Discord.MessageEmbed()
        .setColor('RED')
        .setDescription('You or your opponent doesn\'t have enough.')]});
        return;
    }

    const maxbet = currency.getBalance(opponentid) >= currency.getBalance(authorid) ? currency.getBalance(authorid) : currency.getBalance(opponentid);

    const betMessage = await channel.send({embeds:[new Discord.MessageEmbed()
    .setColor('BLURPLE')
    .setDescription(`<@${authorid}> give me a bet with '${prefix}bet1v1 <amount>'. The maximum amount is: ${maxbet}. (You have 10 seconds)`)]});

    const filter = m => {
        return m.author.id == authorid && m.content.startsWith(prefix + 'bet1v1') && parseInt(m.content.slice(7).trim()) <= maxbet;
    };

    const collector = channel.createMessageCollector({ filter: filter, max: 1, time: 10000 });

    await collector.on('collect', mess => {
        // console.log(parseInt(mess.content.slice(7).trim()));
        const bet = parseInt(mess.content.slice(7).trim());
        isBetValid(channel, opponentid, authorid, bet, currency);
    });
};

const gameL = (game, channel) => {
    let authornum = -1;
    let opponentnum = -1;

    const msgFilter = (msg) => {
        return ((msg.author.id == game.authorid && authornum == -1) ||
            (msg.author.id == game.opponentid && opponentnum == -1))
        && parseInt(msg.content.trim()) >= 0;
    };

    channel.send({embeds:[new Discord.MessageEmbed()
    .setColor('BROWN')
    .setDescription(`<@${game.authorid}>, <@${game.opponentid}> give me a number between 0-100, if you guess closer you win! (You have 10 seconds)`)]});

    const msgcollector = channel.createMessageCollector({ filter: msgFilter, max: 2, time: 10000 });
    let col = 0;
    
    msgcollector.on('collect', mes => {
        // console.log(mes.content);
        if (mes.author.id === game.authorid) {
            authornum = parseInt(mes.content.trim());
            col++;
        }
        if (mes.author.id === game.opponentid) {
            opponentnum = parseInt(mes.content.trim());
            col++;
        }
        if(col === 2) {
            channel.send({embeds:[new Discord.MessageEmbed()
            .setColor('GREEN')
            .setDescription(game.calcWinnerString(authornum, opponentnum))]});
        }
    });

    msgcollector.on('end', (collected, reason) => {
        if (reason === 'time') {
            channel.send({embeds:[new Discord.MessageEmbed().setColor('RED').setDescription('Someone did not give a number... 😡')]});
        }
    });
};

const isBetValid = async (channel, opponentid, authorid, bet, currency) => {
    const betaccept = await channel.send({embeds:[new Discord.MessageEmbed()
    .setColor('BLUE')
    .setDescription(`<@${opponentid}> react to this message if the bet(${
    bet}) is good for you! (You have 5 seconds)`)]});
    
    betaccept.react('✅');
    betaccept.react('❌');
    const reactionFilter = (reaction, user) => {
        // console.log(user.id + ' ' + opponentid + ' ' + authorid);
        return user.id == opponentid && (reaction.emoji.name === '❌' || reaction.emoji.name === '✅');
    };
    
    const reactionC = betaccept.createReactionCollector({ filter: reactionFilter, max: 1, time: 5000 });

    reactionC.on('collect', (reaction, user) => {
        if (reaction.emoji.name === '✅') {
            // console.log(user.id);
            const game = new Game(bet, authorid, opponentid, currency);
            gameL(game, channel);
        }
    });
};

module.exports = {
    oneVOne,
};