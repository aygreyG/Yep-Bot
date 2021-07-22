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

client.once('ready', async () => {
	const storedBalances = await Users.findAll();
	storedBalances.forEach(b => currency.set(b.user_id, b));
	console.log('I\'m ready!' + ` Logged in as '${client.user.tag}'`);
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
	case 'repeat':
		// eslint-disable-next-line no-case-declarations
		const string = args.join(' ');
		message.channel.send(string);
		break;
	default:
		message.channel.send(`${message.author} ilyen commandot nem ismerek!`);
	}
});

client.login(token);

module.exports = { currency };