'use strict';

var Botkit = require('botkit');
var votingIsOpen = false;

var token = process.env.BOT_API_KEY;

function isVotingOpen() {
	var today = new Date();
	//check to see if today's Friday
	if(today.getDay() === 4) {
		//check to see if it is 10AM or later
		if (today.getHours() >= 11 && Date.getHours() <= 14) {
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
};

function askForVote(response, convo) {
	//set up local storage
	convo.say('Here are all the movies that have been suggested');
	convo.ask('Cast a vote', function(response, convo) {
		convo.say('Got it! I\'ll let the projectionist know!');
		incrementVote(response);
		convo.next();
	});
};

function askForSuggestion(response, convo) {
	convo.ask('Suggest a movie title!', function(response, convo) {
		convo.say('Got it! I\'ll add it to the list!');
		addTitle(response);
		convo.next();
	});
};

var usherbot = Botkit.slackbot({
	debug: true,
	//include log: false to disable logging
});

//connect bot to stream of messages
usherbot.spawn({
	token: token,
	//channel: message.channel
}).startRTM();

//give the bot something to listen to
usherbot.hears('hello', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
	bot.reply(message, 'hello');
});

//check to see if voting is open - it will open at 10AM every Friday and close at 1PM on the same day
usherbot.on(['direct_mention', 'message_received'], function(bot, message) {
	var votingIsOpen = true; //remember to change back to isVotingOpen()
	bot.startConversation(message, function(err, convo) {
		if (votingIsOpen === true) {
			convo.say('Voting is open! Respond to me in a direct message your movie suggestion, or a number to cast your vote!');
			convo.ask('What would you like to do?', function(response, convo) {
				convo.say('Cool, right this way... ');
				if(response.text.toLowerCase() === 'vote') {
					askForVote(response, convo);
					convo.next();
				} else {
					askForSuggestion(response, convo);
					convo.next();
				}
			});
		} else {
			bot.startConversation(message, function(err, convo) {
				convo.say('Today is not Friday. Please come again');
			});
		}
	});
});

