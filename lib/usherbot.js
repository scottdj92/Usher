'use strict';

var Botkit = require('botkit');
var votingIsOpen = false;

var token = process.env.BOT_API_KEY;
var redis = require('redis');
//var herokuClient = redis.createClient(process.env.REDIS_URL);
var localClient = redis.createClient();

localClient.on('connect', function() {
	console.log('connected');
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

function addVote(response, convo) {
	//set up local storage
	convo.say('Here are all the movies that have been suggested');
	convo.ask('Cast a vote', function(response, convo) {
		convo.say('Got it! I\'ll let the projectionist know!');
		incrementVote(response);
		convo.stop();
	});
};

function addSuggestion(response, convo) {
	convo.ask('Suggest a movie title!', function(response, convo) {
		convo.say('Got it! I\'ll add it to the list!');
		addTitle(response);
		convo.stop();
	});
};

/* REDIS FUNCTIONS */

function getAllMovies() {
	localClient.hgetall('movies', function(err, object) {
		console.log(object);
	});
};

function incrementVote(titleID) {
	//find movie title with specified ID
	//then increment the votes field for that title
	//localClient.set('movies', [titleID])
};

function addTitle(titleName) {
	localClient.hmset('movies', {
		'title': titleName,
		'votes': 0
	});
};

var usherbot = Botkit.slackbot({
	debug: true,
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
			getAllMovies();
			convo.ask('What would you like to do? You can type a number to vote, or type a title to suggest a new one!', function(response, convo) {
				convo.say('Cool, right this way... ');
				if(response.text.toLowerCase() === 'vote') {
					addVote(response, convo);
					convo.next();
				} else {
					addSuggestion(response, convo);
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

