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
	}).startRTM(function(err) {
		console.log('RTM failed to connect', err);
	});

	this.startListeners();
};

u.isVotingOpen = function () {
	//return true; //uncomment for debugging purposes
	var today = new Date();
	//check to see if today's Friday
	if(today.getDay() === 5) {
		//check to see if it is 10AM or later
		if (today.getHours() >= 11 && today.getHours() <= 14) {
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
};

u.addVote = function (bot, response, convo) {
	this.database.incrementVote(response);
	convo.say('I\'ll let the projectionist know!');
	this.dataService.getAllMovies();
	convo.next();
};

u.addSuggestion = function (bot, response, convo) {
	this.dataService.addMovie(response.text);
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

u.handleFindMovie = function ( result ){
	console.log(result);
	if( result.rowCount > 0 ){
		return true;
	}
	return false;
}

// LISTENERS FOR BOT
u.startListeners = function () {
	var _this = this;
	var slackbot = this.slackbot;
	var flags = this.flags;

	//give the bot something to listen to
	slackbot.hears('hello', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
		bot.reply(message, 'hello');
	});

	slackbot.hears( flags.DANNY, ['direct_message', 'direct_mention'], function(bot, message) {
		bot.reply(message, _this.messages.misc.danny);
	});

	slackbot.hears( flags.SCOTT, ['direct_message', 'direct_mention'], function(bot, message) {
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
	slackbot.hears( flags.ADD_MOVIE, ['direct_message', 'direct_mention'], function(bot, message){
		var voteOpen = _this.isVotingOpen() || true;

		// Voting must be open
		// Search for movie to see if it exists
		// if not add it
		if ( voteOpen ){
			
			var movie = message.text.split( flags.ADD_MOVIE )[1].trim();
			var findMovie = _this.dataService.findMovieByTitle( movie );

			findMovie.then( function(response) {
				if( !_this.handleFindMovie(response) ){
					console.log(movie, "doesn't exist");
					//if movie doesn't exist, add it
					var addMovie = _this.dataService.addMovie( movie );

					addMovie.then( function(response){
						bot.reply( message, _this.handleAddMovie(response,movie) );
					}).catch( function(err) {
						bot.reply( message, _this.messages.error.add );
					})

				} else {
					bot.reply( message, _this.messages.error.duplicate );
				}
			}).catch( function(err) {
				bot.reply( message, _this.messages.error.add );
			}) 

		} else {
			bot.reply( message, _this.messages.error.notFriday );
		}
	});

	///////////////////////////////////////////////
	//fired whenever someone says 'friday movie' //
	///////////////////////////////////////////////
	slackbot.hears(flags.FRIDAY_MOVIE, ['direct_mention', 'mention'], function(bot, message) {
		if(_this.isVotingOpen()) {
			bot.reply(message, 'Voting is open!');
			var allMovies = _this.dataService.getAllMovies();
			allMovies.then(function(response) {
				bot.reply(message, 'Here are all the movies so far!');
				bot.reply(message, _this.handleGetMovies(response));
				bot.reply(message, 'Direct mention me a number to cast your vote, or to add a movie!');
			}).catch(function(err) {
				console.log(err);
			});
		} else {
			bot.reply(message, _this.messages.error.notFriday);
		}
	});

	//determine whether or not to increment vote or add title
	slackbot.on(['direct_mention'], function(bot, message) {
		if (typeof parseInt(message.text) === (typeof 0)) {
			_this.dataService.incrementVote(message.text);
			_this.dataService.findMovieByID(message.text).then(function(response) {
				console.log(response);
				bot.reply(message, 'Your vote for ' + response.rows[0].title + ' was cast!');
			});
		} else {
			_this.dataService.addMovie(message.text);
			_this.dataService.findMovieByTitle(message.text).then(function(response) {
				console.log(response);
				bot.reply(message, response.rows[0].title + ' was added to the list!');
			});
		}
	});

	//shutdown function
	slackbot.hears(['shutdown'], ['direct_mention'], function(bot, message) {
		bot.startConversation(message, function(err, convo) {
			convo.ask('Are you sure you want me to shutdown?', [
			{
				pattern: bot.utterances.yes,
				callback: function(response, convo) {
					convo.say('So the cold, dark night takes me back once again...');
					convo.next();
					setTimeout(function() {
						process.exit();
					}, 3000);
				}
			},
			{
				pattern: bot.utterances.no,
				callback: function(response, convo) {
					convo.say('Pleased to serve you.');
					convo.stop();
				}
			}
			]);
		});
	});
};

module.exports = UsherBot;
