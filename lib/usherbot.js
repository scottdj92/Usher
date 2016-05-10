'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');

var UsherBot = function Constructor(settings) {
	this.settings = settings;
	this.settings.name = this.settings.name || 'usherbot';
	this.dbPath = settings.dbPath || path.resolve(process.cwd(), 'data', 'usherbot.db');

	this.user = null;
	this.db = null;
};

//inherit methods and properties from Bot constructor
util.inherits(UsherBot, Bot);

UsherBot.prototype.run = function() {
	UsherBot.super_.call(this, this.settings);

	this.on('start', this._onStart);
	this.on('message', this._onMessage);
};

UsherBot.prototype._onStart = function() {
	this._loadBotUser();
	this._connectDb();
	this._firstRunCheck();
};

UsherBot.prototype._loadBotUser = function() {
	var self = this;
	this.user = this.users.filter(function(user) {
		return user.name === self.name;
	})[0];
};

UsherBot.prototype._connectDb = function() {
	if(!fs.existsSync(this.dbPath)) {
		console.error('database path ' + '"' + this.dbPath + '"' + 'does not exist');
		process.exit(1);
	}

	this.db = new SQLite.Database(this.dbPath);
};

UsherBot.prototype._firstRunCheck = function() {
	var self = this;
	self.db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', function(err, record) {
		if(err) {
			return console.error('DATABASE ERROR:', err);
		}
		var currentTime = (new Date()).toJSON();

		//this is a first run
		if(!record) {
			self._welcomeMessage();
			return self.db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currentTime);
		}

		//updates with new last running time
		self.db.run('UPDATE info SET val = ? WHERE name = "lastrun"', currentTime);
	});
};

UsherBot.prototype._welcomeMessage = function() {
	this.postMessageToChannel(this.channels[0].name, 'Hello, Please enter your bid for a movie,' + {as_user: true});
};

UsherBot.prototype._onMessage = function(message) {
	if (this._isChatMessage(message) &&
		this._isChannelConversation(message) &&
		!this._isFromUsherBot(message) &&
		this._isMentioningUsherBot(message)
		) {
			this._respondToMessage(message);
	}
};

UsherBot.prototype._isChatMessage = function(message) {
	return message.type === 'message' && Boolean(message.text);
};

UsherBot.prototype._isChannelConversation = function(message) {
	return typeof message.channel === 'string' && message.channel[0] === 'C';
};

UsherBot.prototype._isFromUsherBot = function(message) {
	return message.user === this.user.id;
};

UsherBot.prototype._isMentioningUsherBot = function(message) {
	return message.text.toLowerCase().indexOf('usher bot') > -1 || message.text.toLowerCase().indexOf(this.name) > -1;
};

UsherBot.prototype._respondToMessage = function(originalMessage) {
	var self = this;
	self.db.get('SELECT id, movie FROM movies ORDER BY vote ASC, RANDOM() LIMIT 1', function(err, record) {
		if(err) {
			return console.error('DATABASE ERROR:', err);
		}

		var channel = self._getChannelById(originalMessage.channel);
		self.postMessageToChannel(channel.name, record.movie, {as_user: true});
		self.db.run('UPDATE movie SET vote + 1 WHERE id = ?', record.id);
	});
};

UsherBot.prototype._getChannelById = function(channelId) {
	return this.channels.filter(function (item) {
		return item.id === channelId;
	})[0];
};
module.exports = UsherBot;