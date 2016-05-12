var pg = require('pg');

// DATASERVICE Constructor
function DataService ( client ) {
	var _this = this;
	
	var connect = new Promise( function(resolve, reject) {
		pg.connect(client, function(err, client, done) {
			if(err) {
				console.log("Error connecting to database");
				reject(err);
			} else {
				resolve(client);
			}
		});
	});

	//response is the database client
	connect.then(function(response){
		_this.database = response;
	});
};

var d = DataService.prototype;

d.doQuery = function ( query, options ) {
	var db = this.database;
	options = options || null;

	return new Promise(function(resolve, reject) {
		db.query(query, options, function(err, result) {
			if(result) {
				resolve(result);
			} else {
				reject(err);
			}
		});
	});
};

d.getAllMovies = function () {
	//iterate through all records, showing ID, value, and votes
	var query = 'SELECT * FROM movies';
	return this.doQuery( query );
};

d.incrementVote = function (recordID) {
	//find movie title with specified record ID
	//then increment the votes field for that title
	var query = 'UPDATE movies SET votes = votes + 1 WHERE ' + recordID;
	return this.doQuery( query );
};

d.addMovie = function (movieName) {
	console.log(movieName);
	var stringify = movieName.toString();
	//add record with passed in title and 1 vote
	return this.doQuery( 'INSERT INTO movies (TITLE, VOTES) VALUES ($1, $2)', [stringify, 1] );
};

module.exports = DataService;