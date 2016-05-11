'use strict';

var Botkit = require('botkit');
var DataService = require('./dataService');

// USHERBOT Constructor
function UsherBot ( token, client ) {
	this.votingIsOpen = false;
	this.token = token;
	this.dataService = new DataService( client );
	this.slackbot = Botkit.slackbot({
		debug: true,
		log: true //include log: false to disable logging
	});
}

var u = UsherBot.prototype;

u.start = function () {
	//connect bot to stream of messages
	this.slackbot.spawn({
		token: this.token,
		debug: true
	}).startRTM();

	this.startListeners();
}

u.isVotingOpen = function () {
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

u.addVote = function (bot, response, convo) {
	incrementVote(response);
	convo.say('I\'ll let the projectionist know!');
	this.dataService.getAllMovies();
	convo.next();
};

u.addSuggestion = function (bot, response, convo) {
	addTitle(response.text);
	convo.say('I\'ll add it to the list!');
	this.dataService.getAllMovies();
	convo.next();
};

u.startListeners = function () {
	var _this = this;
	var slackbot = this.slackbot;

	//give the bot something to listen to
	slackbot.hears('hello', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
		bot.reply(message, 'hello');
	});

	slackbot.hears('all movies', ['ambient'], function(bot, message) {
		var allMovies =  _this.dataService.getAllMovies();
		console.log(allMovies);
		bot.reply(message, allMovies);
	});

	//check to see if voting is open - it will open at 10AM every Friday and close at 1PM on the same day
	slackbot.hears('friday', 'friday movie', 'Friday Movie', ['direct_mention', 'ambient'], function(bot, message) {
		var votingIsOpen = true; //remember to change back to isVotingOpen()
		bot.startConversation(message, function(err, convo) {
			console.log(err);
			// 
			if (votingIsOpen === true) {
				convo.say('Voting is open!');
				//loop through all movies and format them
				var allMovies = _this.dataService.getAllMovies();
				convo.say(allMovies);

				convo.ask('What would you like to do? You can type a number to vote, or type a title to suggest a new one!', function(response, convo) {
					convo.say('Right this way... ');
					if(parseInt(response.text)) {
						_this.addVote(bot, response, convo);
					} else {
						_this.addSuggestion(bot, response, convo);
					}
				}),
				convo.on('end', function(convo) {
					if(convo.status === 'completed') {
						bot.reply(message, 'Time to head back into my office...');
					}
				});
			} else {
				bot.startConversation(message, function(err, convo) {
					convo.say('Today is not Friday. Please come again');
					convo.stop();
				});
			}
		});
	});
}

module.exports = UsherBot;
