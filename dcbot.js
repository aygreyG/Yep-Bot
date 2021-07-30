const Discord = require('discord.js');
const client = new Discord.Client();
const { prefix, token } = require('./config.json');
const blackjack = require('./blackjack');
const coinflip = require('./coinflip');

const { Users } = require('./dbObjects');
const currency = new Discord.Collection();

// Help szövege:
const helpEmbed = new Discord.MessageEmbed()
.setColor('#ADE9F2')
.setDescription('__**Commands:**__')
.addFields(
	{ name: `${prefix}help`, value: '❓ Lists all available commands.' },
	{ name: `${prefix}b/-blackjack`, value: '🃏 Starts a new blackjack game.' },
	{ name: `${prefix}f/${prefix}flip <your bet> <heads/tails>`, value: '🪙 Flips a coin.' },
	{ name: `${prefix}balance/${prefix}balance <user tag>`, value: '💰 Shows you your or the tagged user\'s balance.' },
	{ name: `${prefix}l/${prefix}leaderboard`, value: '📋 Shows you the top 15 wealthiest user on the server.' },
	{ name: `${prefix}ping`, value: '🏓 Pings the bot, if it\'s available it will answer.' });

/* add metódus hozzáadása currencyhez */

const leaderboardEmbed = (members) => {
	const mm = members.map(member => member.id);
	return new Discord.MessageEmbed()
	.setColor('ORANGE')
	.setDescription(
		currency.sort((a, b) => b.balance - a.balance)
		.filter(user => client.users.cache.has(user.user_id) && mm.includes(user.user_id) && user.user_id != '')
		.first(15)
		.map((user, position) => `#${position + 1} 👉 ${client.users.cache.get(user.user_id).username}: ${user.balance}`)
		.join('\n'));
};

Reflect.defineProperty(currency, 'add', {
	value: async function add(id, amount) {
		const user = currency.get(id);
		if(user) {
			user.balance += Number(amount);
			return user.save();
		}
		const newUser = await Users.create({ user_id: id, balance: amount });
		currency.set(id, newUser);
		console.log('new user created: ' + user.user_id);
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
	client.user.setActivity('-help', { type: 'LISTENING' });
	storedBalances.forEach(b => {
		if (b.user_id != '' && b.user_id != 'Ez egy id' && b.user_id > 0) {
			currency.set(b.user_id, b);
			client.users.fetch(b.user_id);
		}
	});
	console.log('I\'m ready!' + ` Logged in as '${client.user.tag}'`);
});

client.on('message', message => {
	if (message.content.toLowerCase().includes('yep') && !message.author.bot) message.reply('COCK');
	if (!message.content.startsWith(prefix) || message.author.bot) return;
	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

	if (!message.guild) {
		switch (command) {
			case 'f':
			case 'flip':
				if ((parseInt(args[0]) > 0 && parseInt(args[0]) <= currency.getBalance(message.author.id)) || (parseInt(args[0]) == 1 && currency.getBalance(message.author.id) <= 0)) {
					coinflip.flip(message, currency, parseInt(args[0]), args[1].toLowerCase());
				}
				else if ((parseInt(args[1]) > 0 && parseInt(args[1]) <= currency.getBalance(message.author.id)) || (parseInt(args[1]) == 1 && currency.getBalance(message.author.id) <= 0)) {
					coinflip.flip(message, currency, parseInt(args[1]), args[0].toLowerCase());
				}
				break;
			case 'ping':
				message.channel.send(new Discord.MessageEmbed()
				.setColor('#D57A6F')
				.setDescription(`Pong 🏓 ${message.author}`));
				break;
			case 'help':
				message.channel.send(helpEmbed);
				break;
			case 'balance':
				message.channel.send(new Discord.MessageEmbed()
				.setColor('DARK_ORANGE')
				.setDescription(`${message.author}, you have: ${currency.getBalance(message.author.id)}`));
				break;
			default:
		}
	}
	else {
		switch(command) {
		case 'f':
		case 'flip':
			if ((parseInt(args[0]) > 0 && parseInt(args[0]) <= currency.getBalance(message.author.id)) || (parseInt(args[0]) == 1 && currency.getBalance(message.author.id) <= 0)) {
				coinflip.flip(message, currency, parseInt(args[0]), args[1].toLowerCase());
			}
			else if ((parseInt(args[1]) > 0 && parseInt(args[1]) <= currency.getBalance(message.author.id)) || (parseInt(args[1]) == 1 && currency.getBalance(message.author.id) <= 0)) {
				coinflip.flip(message, currency, parseInt(args[1]), args[0].toLowerCase());
			}
			break;
		case 'ping':
			message.channel.send(new Discord.MessageEmbed()
			.setColor('#D57A6F')
			.setDescription(`Pong 🏓 ${message.author}`));
			break;
		case 'help':
			message.channel.send(helpEmbed);
			break;
		case 'l':
		case 'leaderboard':
			message.guild.members.fetch().then(members => {
				message.channel.send(leaderboardEmbed(members));
			}).catch(console.error);
			break;
		case 'bet':
			break;
		case 'b':
		case 'blackjack':
			blackjack.start(message, currency);
			break;
		case 'balance':
			if (message.mentions.users.size) {
				message.channel.send(new Discord.MessageEmbed()
					.setColor('DARK_ORANGE')
					.setDescription(`${message.mentions.users.first()} has: ${currency.getBalance(message.mentions.users.first().id)}`));
			}
			else {
				message.channel.send(new Discord.MessageEmbed()
					.setColor('DARK_ORANGE')
					.setDescription(`${message.author}, you have: ${currency.getBalance(message.author.id)}`));
			}
			break;
		case 'id':
			if (args.length > 0) {
				message.channel.send(message.mentions.users.first().id);
			}
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
		default:
		}
	}
});

client.login(token);

module.exports = { currency };