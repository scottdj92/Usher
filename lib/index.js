'use strict';
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
