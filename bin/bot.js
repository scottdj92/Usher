'use strict';

var UsherBot = require('../lib/usherbot');

var token = process.env.BOT_API_KEY;
var dbPath = process.env.BOT_DB_PATH;
var name = process.env.BOT_NAME;

var usherbot = new UsherBot({
	token: token,
	dbPath: dbPath,
	name: name
});

usherbot.run();