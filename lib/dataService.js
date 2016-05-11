var pg = require('pg');

// DATASERVICE Constructor
var DataService = module.exports = function DataService ( client ) {

	this.database = pg.connect(client, function(err, client, done) {
		console.log(client);
		if(err) {
			return console.error('error fetching client from pool', err);
		}
		return client;
	});
}

var d = DataService.prototype;

d.getAllMovies = function () {
	//iterate through all records, showing ID, value, and votes
	this.database.query('SELECT * FROM movies', function(err, result) {
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

d.incrementVote = function (recordID) {
	var _this = this;
	//find movie title with specified record ID
	//then increment the votes field for that title
	this.database.query('UPDATE movies SET votes = votes + 1 WHERE ' + recordID, function(err, result) {
		done(_this.database);
		console.log(result);
	});
};

d.addTitle = function (titleName) {
	var _this = this;
	console.log(titleName);
	var stringify = titleName.toString();
	//add record with passed in title and 1 vote
	this.database.query('INSERT INTO movies (TITLE, VOTES) VALUES ($1, $2)', [stringify, 1], function(err, result) {
		done(_this.database);
		console.log(result);
	});
};