'use strict';

/* DEPENDENCIES */
var dotenv = require('dotenv'); 
var usherBot = require('./usherbot');

// Load environment variables from .env
dotenv.load();

/* ENV VARS */
var token = process.env.BOT_API_KEY;
var localClient = process.env.PG_URL;
//var herokuClient = redis.createClient(process.env.DATABASE_URL);


// Starting component
var usher = new usherBot( token, localClient );
usher.start();