'use strict';

var Botkit = require('botkit');
var DataService = require('./dataService');
var Messages = require('./messageContent');
var Flags = require('./messageFlags');

// USHERBOT Constructor
function UsherBot ( token, client ) {
	this.votingIsOpen = false;
	this.token = token;
	this.messages = Messages;
	this.flags = Flags;
	this.dataService = new DataService( client );
	this.slackbot = Botkit.slackbot({
		//debug: true,
		//log: true //include log: false to disable logging
	});
};

var u = UsherBot.prototype;

u.start = function () {
	//connect bot to stream of messages
	this.slackbot.spawn({
		token: this.token,
	}).startRTM();

	this.startListeners();
};

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

// HANDLING RESPONSES FROM THE DB
u.handleGetMovies = function ( result ){
	//iterate through all records, showing ID, value, and votes
	if (result && result.rows.length > 0){
		var tableString = '```';
		tableString += "ID" + '\t' + "Title" + '\t' + "Votes" + "\n" + "===================" + "\n";		
		result.rows.forEach(function(row, i) {
			var temp = row.id + '\t' + row.title + "\t" + row.votes + "\n";
			tableString += temp;
		});
		tableString += '```';
		return tableString;
	}

	return "No movies found. Start voting fam";
};

u.handleAddMovie = function ( result, movie ){
	console.log(result);
	return this.messages.success.add.replace( "{movie}", movie );
};

// LISTENERS FOR BOT
u.startListeners = function () {
	var _this = this;
	var slackbot = this.slackbot;
	var flags = this.flags;

	//give the bot something to listen to
	slackbot.hears('hello', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
		bot.reply(message, 'hello');
	});

	slackbot.hears( flags.DANNY, ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
		bot.reply(message, _this.messages.misc.danny);
	});

	slackbot.hears( flags.SCOTT, ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
		bot.reply(message, _this.messages.misc.scott);
	});

	// LISTING MOVIES
	slackbot.hears( flags.MOVIES , ['direct_message', 'direct_mention'], function(bot, message) {
		var query = _this.dataService.getAllMovies();

		query.then( function(response) {
			bot.reply( message, _this.handleGetMovies(response) );
		}).catch( function(err) {
			console.log(err);
			bot.reply( message, _this.messages.error.movies );
		}) 
	});

	// ADDING MOVIE
	slackbot.hears( flags.ADD_MOVIE, ['direct_message', 'direct_mention', 'mention'], function(bot, message){
		var voteOpen = _this.isVotingOpen() || true;

		if ( voteOpen ){
			var movie = message.text.split( flags.ADD_MOVIE )[1].trim();
			var query = _this.dataService.addMovie( movie );

			query.then( function(response) {
				bot.reply( message, _this.handleAddMovie(response,movie) );
			}).catch( function(err) {
				console.log(err);
				bot.reply( message, _this.messages.error.add );
			}) 

		} else {
			bot.reply( message, _this.messages.error.notFriday );
		}
	});

	//check to see if voting is open - it will open at 10AM every Friday and close at 1PM on the same day
	slackbot.hears('friday movie', 'Friday Movie', ['direct_mention'], function(bot, message) {
		var votingIsOpen = true; //remember to change back to isVotingOpen()
		bot.startConversation(message, function(err, convo) {
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
};

module.exports = UsherBot;
