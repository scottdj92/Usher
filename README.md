# Usher Slackbot

##Getting Started

Before taking any steps you need to get a BOT API KEY from the Slack intergration settings and create a bot to test with

1) Install dependencies 
* run `npm install`

2) Install `postgrepsql` (possible from Homebrew)
* After installing, you will need to run the background service (or edit your launch agent to run service in backgrond from boot it)

3) Setup DB
* run `postgres -D /usr/local/var/postgres`
* Next few steps may only need to be run once
* run `which psql` which should return the location of psql
* run `createdb 'whoami'` to produce the database
* run `psql` to start postgrep clli
* `CREATE DATABASE dbName`
* run `\du` to check if any superuser role is present on the database (should be your user). If not run `CREATE ROLE "name" WITH LOGIN PASSWORD "password"`
* `\q` to exit current database. 
* run `psql dbName userName -h localhost` to enter cli for you new db
* run `CREATE TABLE movies ( title varchar(80), votes int);` to create a table with the specified structure

4.) Run Bot
* You need two environment variables, BOT_API_KEY, and PG_URL (url to hit database)
* create a .env file in the working directory with the env variables defined in it

## Running the bot locally
* run `postgres -D /usr/local/var/postgres`
* run `npm start`

