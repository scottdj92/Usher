var pg = require('pg');

// DATASERVICE Constructor
function DataService ( client ) {
	var _this = this;
	
	var connect = new Promise( function(resolve, reject) {
		pg.connect(client, function(err, client, done) {
			if(client) {
				console.log('connected to ', client.database + ' as ' + client.user);
				resolve(client);
			} else {
				console.log("Error connecting to database");
				reject(err);
			}
		});
	});

	//response is the database client
	connect.then(function(response){
		_this.database = response;
	});
};

var d = DataService.prototype;

/////////////////////////////////////////////////////////////////////////////
//sanitize function. you can pass in a delimiter, or use the default space //
/////////////////////////////////////////////////////////////////////////////
d.sanitize = function( string, delimiter ) {
	delimiter = delimiter || ' ';
	var db = this.database;
	var formattedString = '';

	//not a string, but an integer
	debugger;
	if (!parseInt(string)) {
		console.log(string);
		var arrayOfStrings = string.split(delimiter);
		arrayOfStrings.forEach(function(substr, i) {
			var temp = substr.toLowerCase().charAt(0).toUpperCase() + substr.slice(1) + ' ';
			formattedString += temp;
		});
	} else {
		formattedString = string;
	}

	console.log(formattedString);
	return formattedString;
};

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
	var stringify = parseInt(this.sanitize(recordID));
	var query = 'UPDATE movies SET votes = votes + 1 WHERE id = ' + stringify;
	return this.doQuery( query );
};

d.addMovie = function (title) {
	var stringify = this.sanitize(title).toString();
	//add record with passed in title and 1 vote
	return this.doQuery( 'INSERT INTO movies (TITLE, VOTES) VALUES ($1, $2)', [stringify, 1] );
};

d.findMovieByTitle = function (title) {
	console.log("Finding", title);
	var stringify = this.sanitize(title).toString();
	return this.doQuery( 'SELECT * FROM movies WHERE (title LIKE \'%'+ stringify +'%\')' );
};

d.findMovieByID = function (ID) {
	console.log("Finding", ID);
	var stringify = this.sanitize(ID);
	return this.doQuery( 'SELECT * FROM movies WHERE ID =' + stringify );
};

module.exports = DataService;