const Discord = require('discord.js');
const client = new Discord.Client();
const { prefix, token } = require('./config.json');
const blackjack = require('./blackjack');

const { Users } = require('./dbObjects');
const { Op } = require('sequelize');
const currency = new Discord.Collection();

/* add metódus hozzáadása currencyhez */

Reflect.defineProperty(currency, 'add', {
	value: async function add(id, amount) {
		const user = currency.get(id);
		if(user) {
			user.balance += Number(amount);
			return user.save();
		}
		const newUser = await Users.create({ user_id: id, balance: amount });
		currency.set(id, newUser);
		console.log('new user created: ' + user);
		return newUser;
	},
});

/* getBalance metódus hozzáadása currencyhez */

Reflect.defineProperty(currency, 'getBalance', {
	value: function getBalance(id) {
		const user = currency.get(id);
		if (user) {
			return user.balance;
		}
		currency.add(id, 100);
		return 100;
	},
});

const embedTest = (channel, user) => {
	const embed = new Discord.MessageEmbed()
	.setColor('#000000')
	.setTitle('Blackjack')
	// .attachFiles(['./PNG/aces.png'])
	.setDescription('KEK')
	.setThumbnail('https://www.seekpng.com/png/full/819-8194226_blackjack-instant-game-logo-graphic-design.png')
	.addFields(
		{ name: 'Emberek: ', value: 'Lapok: ' },
		{ name: user.username, value: `Minden is  ${user}`, inline: true },
		{ name: 'Valaki0', value: 'Kevésbé minden is \nBusted!', inline: true },
		{ name: 'Valaki1', value: 'Kevésbé minden is adaw sa\n`WON!`', inline: true },
		{ name: 'Valaki2', value: 'Kevésbé minden is a sda a sd', inline: true },
		{ name: 'Valaki3', value: 'Kevésbé minden is adwada sd sa', inline: true },
		{ name: 'Valaki4', value: 'Kevésbé minden is adwada sd sa\n#1 Victory Royale!', inline: true },
		)
	// .setImage('attachment://aces.png')
	.addField('\u200b', '\u200b');
	// .setImage('https://media.giphy.com/media/26uf19Em2GHT2lkhW/giphy.gif');

	channel.send(embed);
};

client.once('ready', async () => {
	const storedBalances = await Users.findAll();
	storedBalances.forEach(b => currency.set(b.user_id, b));
	console.log('I\'m ready!' + ` Logged in as '${client.user.tag}'`);
	// const channel = client.channels.cache.find(ch => ch.name === 'botcsanel');
	// embedTest(channel, client.user);
});

client.on('message', message => {
	if (message.content.toLowerCase().includes('yep')) message.reply('COCK');
	if (!message.content.startsWith(prefix) || message.author.bot) return;
	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

	switch(command) {
	case 'ping':
		message.channel.send(`Pong 🏓 ${message.author}`);
		break;
	case '':
		message.channel.send('Huh 🤷🏼‍♂️?');
		break;
	case 'bet':
		break;
	case 'b':
		if (args[0] === 'start') {
            // message.channel.send(`${message.author} started a blackjack round, type '-blackjack join' to join it`);
			/* ide kell a fgv hivas talan */
			blackjack.start(message, currency);
		}
		break;
	case 'balance':
		message.reply(`you have ${currency.getBalance(message.author.id)}`);
		break;
	case 'test':
		blackjack.test();
		break;
	case 'id':
		message.channel.send(message.mentions.users.first().id);
		break;
	case 'add':
		if (message.author.id === '107398653542400000') {
			if (message.mentions.users.size) {
				currency.add(message.mentions.users.first().id, args[1]);
				return message.channel.send(`${message.mentions.users.first()} now has ${
					currency.getBalance(message.mentions.users.first().id)}`);
			}
			currency.add(message.author.id, args[0]);
			message.reply(`you now have ${currency.getBalance(message.author.id)}`);
		}
		break;
	case 'embed':
		embedTest(message.channel, message.author);
		break;
	// case 'repeat':
	// 	 // eslint-disable-next-line no-case-declarations
	// 	 const string = args.join(' ');
	// 	 message.channel.send(string);
	// 	 break;
	default:
		message.channel.send(`${message.author} ilyen commandot nem ismerek!`);
	}
});

client.login(token);

module.exports = { currency };