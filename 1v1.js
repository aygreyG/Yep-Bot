const Discord = require('discord.js');
const prefix = require('config.json');

class Game {
    constructor(bet, authorid, opponentid) {
        this.bet = bet;
        this.rand = Math.floor(Math.random() * 100);
        this.authornum;
        this.opponentnum;
        this.authorid = authorid;
        this.opponentid = opponentid;
    }

    set authornum(number) {
        this.authornum = number;
    }

    set opponentnum(number) {
        this.opponentnum = number;
    }

    get winner() {
        return this.calcWinner();
    }

    calcWinner() {
        if (Math.abs(this.authornum - this.rand) < Math.abs(this.opponentnum - this.rand)) {
            return `<@${opponentid}> won: ${this.bet}`;
        } else if (Math.abs(num1 - this.rand) > Math.abs(num2 - this.rand)) {
            return 'au';
        } else return 'eq';
    }
}

const oneVOne = async (channel, currency, authorid, opponentid) => {
    if (currency.getBalance(authorid) <= 0 || currency.getBalance(opponentid) <= 0) {
        channel.send(new Discord.MessageEmbed()
        .setColor('RED')
        .setDescription('You or your opponent doesn\'t have enough.'))
        return;
    }

    const maxbet = currency.getBalance(opponentid) >= currency.getBalance(authorid) ? currency.getBalance(authorid) : currency.getBalance(opponentid);

    let betMessage = await channel.send(new Discord.MessageEmbed()
    .setColor('BLURPLE')
    .setDescription(`<@${authorid}> give me a bet with \'${prefix}bet1v1 <amount>\'. The maximum amount is: ${maxbet}`))

    const filter = m => {
        return m.author.id == authorid && m.content.startsWith(prefix + 'bet1v1') && parseInt(m.content.slice(7).trim()) <= maxbet;
    }

    const collector = channel.createMessageCollector(filter, { max: 1, time: 10000 });

    const game;

    collector.on('collect', async mess => {
        const bet = parseInt(mess.content.slice(7).trim);
        betaccept = await channel.send(new Discord.MessageEmbed()
        .setColor('BLUE')
        .setDescription(`<@${opponentid}> react to this message if the bet(${
        bet}) is good for you`));
        
        betaccept.react('✅');
        betaccept.react('❌');

        reactionFilter = (reaction, user) => {
            return user.id == opponentid && reaction.emoji.name === '❌' || reaction.emoji.name === '✅';
        }
        
        const reactionC = await channel.createReactionCollector(reactionFilter, { max: 1, time: 5000 });

        reactionC.on('collect', (reaction, user) => {
            if (reaction.emoji.name === '✅') {
                game = new Game(bet, authorid, opponentid);
            }
        });
    });
    
    if (game === null) {
        return;
    }

    const msgFilter = (msg) => {
        return ((msg.author.id == authorid && game.authornum == null) ||
            (msg.author.id == opponentid && game.opponentnum == null))
        && parseInt(msg.content.trim()) >= 0 ;
    }

    channel.send(new Discord.MessageEmbed()
    .setColor('BROWN')
    .setDescription(`<@${authorid}>, <@${opponentid}> give me a number between 0-100, if you guess closer the bet is yours!`));

    const msgcollector = channel.createMessageCollector(msgFilter, { max: 2, time: 10000 });

    msgcollector.on('message', mes => {
        if (mes.author.id === authorid) {
            game.authornum = parseInt(mes.content.trim());
        }
        if (mes.author.id === opponentid) {
            game.opponentnum = parseInt(mes.content.trim());
        }
    });

    channel.send(new Discord.MessageEmbed()
    .setColor('RANDOM')
    .setDescription(`${}`))
}