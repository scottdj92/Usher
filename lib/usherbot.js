'use strict';

var Botkit = require('botkit');
var votingIsOpen = false;

var token = process.env.BOT_API_KEY;
var pg = require('pg');
//var herokuClient = pg.createClient(process.env.DATABASE_URL);
var localClient = process.env.PG_URL;
var database = null;

pg.connect(localClient, function(err, client, done) {
	if(err) {
		return console.error('error fetching client from pool', err);
	}
	database = client;
	database.query('SELECT $1::int AS number', [1], function(err, result) {
		//done();

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

function doQuery(query) {
	//return promise
	return new Promise(function(resolve, reject) {
		database.query(query, function(err, result) {
			if(result) {
				resolve(result);
			} else {
				reject(err);
			}
		});
	});
};

function addVote(bot, response, convo) {
	incrementVote(response);
	convo.say('I\'ll let the projectionist know!');
	getAllMovies(convo);
	convo.next();
};

function addSuggestion(bot, response, convo) {
	var title = addTitle(response.text);
	console.log('title', title);
	if(title === false) {
		convo.ask('that\'s already on the list, please try again.');
	} else {
		convo.say('I\'ll add it to the list!');
		getAllMovies(convo);
		convo.next();
	}
};

/* DATABASE FUNCTIONS */

function getAllMovies(convo) {
	convo.say('Here\'s all the movies...');
	var tableString = '```';
	//iterate through all records, showing ID, value, and votes
	var query = 'SELECT * FROM movies';
	doQuery(query).then(function(response) {
		response.rows.forEach(function(row, i) {
			var temp = row.id + '\t' + row.title + "\t" + row.votes + "\n";
			tableString += temp;
		});
		tableString += '```';
		convo.say(tableString);
	}, function(error) {
		console.log('getAllMovies SQL error');
	});
};

function incrementVote(recordID) {
	//find movie title with specified record ID
	//then increment the votes field for that title
	var query = 'UPDATE movies SET votes = votes + 1 WHERE ' + recordID;
	doQuery(query).then(function(response) {
		console.log('record updated');
	}, function(error) {
		console.log('incrementVote SQL error');
	});
};

function checkIfMatched(columnName, value) {
	//TODO: sanitize string
	var query = "SELECT * FROM public.movies WHERE (" + columnName + " LIKE '%" + value.toString() + "%')";
	return doQuery(query).then(function(response) {
		//return true, as the rows matched
		console.log(response);
		return true;
	}).catch(function(error) {
		console.log(error);
		//we did not match
		return false;
	});
};

function addTitle(titleName) {
	var matched = checkIfMatched('title', titleName);
	console.warn(matched);
	matched.then(function(response) {
		//add record with passed in title and 1 vote
		var query = 'INSERT INTO public.movies (title, votes) VALUES (\'' + titleName.toString() + '\', 1)';
		doQuery(query).then(function(response) {
			console.log('title added');
		}, function(error) {
			console.log('addTitle SQL error', error);
		});
	}).catch(function(error) {
		console.log('we didnt do it', error);
	});
};

var usherbot = Botkit.slackbot({
	debug: false,
	log: false
	//include log: false to disable logging
});

//connect bot to stream of messages
usherbot.spawn({
	token: token,
}).startRTM(function(err) {
	if(err) {
		console.log(err);
	}
});

//give the bot something to listen to
usherbot.hears(['hello'], 'direct_message', 'direct_mention', 'mention', function(bot, message) {
	bot.reply(message, 'hello');
});

usherbot.hears('all movies', ['ambient'], function(bot, message) {
	bot.reply(message, 'yes, here they are');
	bot.startConversation(message, function(err, convo) {
		getAllMovies(convo);
	});
});

//check to see if voting is open - it will open at 10AM every Friday and close at 1PM on the same day
usherbot.hears('call', ['direct_mention','mention','direct_message'], function(bot, message) {
	var votingIsOpen = true; //remember to change back to isVotingOpen()
	bot.startConversation(message, function(err, convo) {
		if (votingIsOpen === true) {
			convo.say('Voting is open!');
			
			//show all movies
			getAllMovies(convo);
			convo.next();

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
				} else {
					bot.reply(message, 'shit is broken');
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

