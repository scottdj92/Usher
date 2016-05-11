'use strict';

var Botkit = require('botkit');
var votingIsOpen = false;

var dotenv = require('dotenv');
// Load environment variables from .env 
dotenv.load();

var token = process.env.BOT_API_KEY;
var pg = require('pg');
//var herokuClient = redis.createClient(process.env.DATABASE_URL);
var localClient = process.env.PG_URL;
var database = null;

pg.connect(localClient, function(err, client, done) {
	if(err) {
		return console.error('error fetching client from pool', err);
	}
	database = client;
	database.query('SELECT $1::int AS number', [1], function(err, result) {
		done();

		console.log(result.rows[0].number);
	});
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
	//iterate through all records, showing ID, value, and votes
	database.query('SELECT * FROM movies', function(err, result) {
		console.log(result);
		var tableString = '```';
		result.rows.forEach(function(row, i) {
			var temp = row.id + '\t' + row.title + "\t" + row.votes + "\n";
			tableString += temp;
		});
		tableString += '```';
		return tableString;
	});
};

function incrementVote(recordID) {
	//find movie title with specified record ID
	//then increment the votes field for that title
	database.query('UPDATE movies SET votes = votes + 1 WHERE ' + recordID, function(err, result) {
		done(database);

		console.log(result);
	});
};

function addTitle(titleName) {
	console.log(titleName);
	var stringify = titleName.toString();
	//add record with passed in title and 1 vote
	database.query('INSERT INTO movies (TITLE, VOTES) VALUES ($1, $2)', [stringify, 1], function(err, result) {
		done(database);

		console.log(result);
	});
};

var usherbot = Botkit.slackbot({
	debug: true,
	log: true
	//include log: false to disable logging
});

//connect bot to stream of messages
usherbot.spawn({
	token: token,
	debug: true
}).startRTM();

//give the bot something to listen to
usherbot.hears('hello', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
	bot.reply(message, 'hello');
});

usherbot.hears('all movies', ['ambient'], function(bot, message) {
	var allMovies = getAllMovies();
	console.log(allMovies);
	bot.reply(message, allMovies);
});

//check to see if voting is open - it will open at 10AM every Friday and close at 1PM on the same day
usherbot.hears('friday', 'friday movie', 'Friday Movie', ['direct_mention', 'ambient'], function(bot, message) {
	var votingIsOpen = true; //remember to change back to isVotingOpen()
	bot.startConversation(message, function(err, convo) {
		console.log(err);
		if (votingIsOpen === true) {
			convo.say('Voting is open!');
			console.log(bot);
			//loop through all movies and format them
			var allMovies = getAllMovies();
			convo.say(allMovies);

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

