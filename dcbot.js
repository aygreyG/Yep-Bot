const Discord = require('discord.js');
const client = new Discord.Client();
const { prefix, token } = require('./config.json');
const blackjack = require('./blackjack');

const { Users } = require('./dbObjects');
const { Op } = require('sequelize');
const currency = new Discord.Collection();

// Help szövege:
const helpEmbed = new Discord.MessageEmbed()
	.setColor('#48C9B0')
	.setDescription('Nothing here yet...');

/* add metódus hozzáadása currencyhez */

const leaderboardEmbed = (members) => {
	const mm = members.map(member => member.id);
	// console.log(mm);
	return new Discord.MessageEmbed()
	.setColor('ORANGE')
	.setDescription(
		currency.sort((a, b) => b.balance - a.balance)
		.filter(user => client.users.cache.has(user.user_id) && mm.includes(user.user_id)/*&& message.guild.members.cache.has(user.user_id)*/ && user.user_id != '')
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

// const embedTest = (channel, user) => {
// 	const embed = new Discord.MessageEmbed()
// 	.setColor('#000000')
// 	.setTitle('Blackjack')
// 	// .attachFiles(['./PNG/aces.png'])
// 	.setDescription('KEK')
// 	.setThumbnail('https://www.seekpng.com/png/full/819-8194226_blackjack-instant-game-logo-graphic-design.png')
// 	.addFields(
// 		{ name: 'Emberek: ', value: 'Lapok: ' },
// 		{ name: user.username, value: `Minden is  ${user}`, inline: true },
// 		{ name: 'Valaki0', value: 'Kevésbé minden is \nBusted!', inline: true },
// 		{ name: 'Valaki1', value: 'Kevésbé minden is adaw sa\n`WON!`', inline: true },
// 		{ name: 'Valaki2', value: 'Kevésbé minden is a sda a sd', inline: true },
// 		{ name: 'Valaki3', value: 'Kevésbé minden is adwada sd sa', inline: true },
// 		{ name: 'Valaki4', value: 'Kevésbé minden is adwada sd sa\n#1 Victory Royale!', inline: true },
// 		)
// 	// .setImage('attachment://aces.png')
// 	.addField('\u200b', '\u200b');
// 	// .setImage('https://media.giphy.com/media/26uf19Em2GHT2lkhW/giphy.gif');

// 	channel.send(embed);
// };

client.once('ready', async () => {
	const storedBalances = await Users.findAll();
	storedBalances.forEach(b => {
		if (b.user_id != '' && b.user_id != 'Ez egy id' && b.user_id > 0) {
			currency.set(b.user_id, b);
			client.users.fetch(b.user_id);
		}
	});
	console.log('I\'m ready!' + ` Logged in as '${client.user.tag}'`);
	// const channel = client.channels.cache.find(ch => ch.name === 'botcsanel');
	// embedTest(channel, client.user);
});

client.on('message', message => {
	if (message.content.toLowerCase().includes('yep') && !message.author.bot) message.reply('COCK');
	if (!message.content.startsWith(prefix) || message.author.bot) return;
	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

	switch(command) {
	case 'ping':
		message.channel.send(`Pong 🏓 ${message.author}`);
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
	default:
	}
});

client.login(token);

module.exports = { currency };