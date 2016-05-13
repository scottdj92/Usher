'use strict';

/* DEPENDENCIES */
var usherBot = require('./usherbot');

// Load local dev environment variables from .env
if( process.env.NODE_ENV == "DEV" ) {
	var dotenv = require('dotenv'); 
	dotenv.load();
}

/* ENV VARS */
var token = process.env.BOT_API_KEY;
var localClient = process.env.PG_URL;
//var herokuClient = redis.createClient(process.env.DATABASE_URL);


// Starting component
var usher = new usherBot( token, localClient );
usher.start();