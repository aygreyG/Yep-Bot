const Discord = require('discord.js');

// -flip heads/tails <bet>
// -flip <bet> heads/tails

const flip = (message, currency, bet, headsOrTails) => {
    // rand < 0.5 HEADS
    // rand >= 0.5 TAILS
    const rand = Math.random();

    // ANTI BIAS TEST
    // let head = 0, tail = 0;
    // for (let i = 0; i < 10000; i++) {
    //     const rand = Math.random();
    //     if (rand < 0.5) head++;
    //     if (rand >= 0.5) tail++;
    // }
    // message.channel.send(head + ' ' + tail);

    if ((headsOrTails == 'heads' && rand < 0.5) || (headsOrTails == 'tails' && rand >= 0.5)) {
        currency.add(message.author.id, bet);
        message.channel.send(new Discord.MessageEmbed()
        .setColor('#AFEC28')
        .setAuthor('Yep Coinflip')
        .attachFiles(['./fos.png'])
        .setThumbnail('attachment://fos.png')
        .addField(`${headsOrTails.toUpperCase()}`, `${message.author} won: \`${bet}\``));
    }
    else {
        currency.add(message.author.id, -bet);
        message.channel.send(new Discord.MessageEmbed()
        .setColor('#A00000')
        .setAuthor('Yep Coinflip')
        .attachFiles(['./fos.png'])
        .setThumbnail('attachment://fos.png')
        .addField(`${headsOrTails == 'heads' ? 'TAILS' : 'HEADS' }`, `${message.author} lost: \`${bet}\``));
    }
};

module.exports = { flip };