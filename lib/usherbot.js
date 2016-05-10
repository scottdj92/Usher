'use strict';

var Botkit = require('botkit');

var controller = Botkit.slackbot({
	debug: true,
	//include log: false to disable logging
});

//connect bot to stream of messages
controller.spawn({
	token: BOT_API_KEY
}).startRTM();

//give the bot something to listen to
controller.hears('hello', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
	bot.reply('hello, yourself');
});