'use strict';

var Botkit = require('botkit');
var votingIsOpen = false;

var token = process.env.BOT_API_KEY;
var redis = require('redis');
//var herokuClient = redis.createClient(process.env.REDIS_URL);
var localClient = redis.createClient();

localClient.on('connect', function() {
	console.log('connected');
	//localClient.set(record, 'test', redis.print);
});


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

function addVote(bot, response, convo) {
	incrementVote(response);
	convo.say('I\'ll let the projectionist know!');
	getAllMovies();
	convo.next();
};

function addSuggestion(bot, response, convo) {
	addTitle(response.text);
	convo.say('I\'ll add it to the list!');
	getAllMovies();
	convo.next();
};

/* REDIS FUNCTIONS */

function getAllMovies() {
	localClient.hkeys('movies', function(err, movies) {
		if(err) {
			console.log(err);
		} else {
			movies.forEach(function(movie, i) {
				//each key has 2 values: title and votes
				console.log('    ' + i + ': ' + movie);
				console.log(localClient.hgetall(movie));
			});
		}
	});
};

//helper function to get all keys and values
function MHGETALL(keys, cb) {
	localClient.multi({pipeline: false});

	//get all info for each key
	keys.forEach(function(key, i) {
		localClient.hgetall(key);
	});

	localClient.exec(function(err, result) {
		cb(err, result);
	});
};

function incrementVote(titleID) {
	//find movie title with specified ID
	//then increment the votes field for that title
	//localClient.set('movies', [titleID])
};

function addTitle(titleName) {
	console.log(titleName);
	localClient.hset(['movies', 'title', titleName.toString()], redis.print);
	localClient.hset(['movies', 'votes', 0], redis.print);
};

var usherbot = Botkit.slackbot({
	debug: false,
	log: false
	//include log: false to disable logging
});

//connect bot to stream of messages
usherbot.spawn({
	token: token,
}).startRTM();

//give the bot something to listen to
usherbot.hears('hello', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
	bot.reply(message, 'hello');
});

//check to see if voting is open - it will open at 10AM every Friday and close at 1PM on the same day
usherbot.on(['direct_mention'], function(bot, message) {
	var votingIsOpen = true; //remember to change back to isVotingOpen()
	bot.startConversation(message, function(err, convo) {
		if (votingIsOpen === true) {
			convo.say('Voting is open!');
			//loop through all movies and format them
			//getAllMovies();
			convo.ask('What would you like to do? You can type a number to vote, or type a title to suggest a new one!', function(response, convo) {
				convo.say('Right this way... ');
				if(parseInt(response.text)) {
					addVote(bot, response, convo);
				} else {
					addSuggestion(bot, response, convo);
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
				covo.stop();
			});
		}
	});
});

