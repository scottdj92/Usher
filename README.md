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
* `CREATE DATABASE dbName;`
* Create a user by running `CREATE ROLE "name" WITH LOGIN PASSWORD "password";`
* run `\du` to check if the role is there. 
* `\q` to exit current database. 
* run `psql dbName userName -h localhost` to enter cli for your new db
* run `CREATE TABLE movies ( id SERIAL, title varchar(80), votes int);` to create a table with the specified structure

4.) Run Bot
* You need two environment variables, BOT_API_KEY, and PG_URL (url to hit database)
* create a .env file in the working directory with the env variables defined in it

## Running the bot locally
* run `postgres -D /usr/local/var/postgres`
* run `npm start`

## Deploying
* Deploying on Heroku is easy
* Check to ensure that you have Postgresql by running `heroku pg:info`

1) Setting up your Heroku pg database
* Establish a database by running `heroku addons:create heroku-postgresql:hobby-dev` 
	* Where `hobby-dev` is the plan name. For our purposes we'll use the free hobby dev plan
	* You will see something like `HEROKU_POSTGRESQL_COLOR_URL`. This is the alias for the URL of your database
* Run `heroku pg:psql`
* YOU MUST HAVE POSTGRESQL INSTALLED TO USE `heroku pg:psql`
* This will establish a connection to your Heroku pg database
2) Creating your database
* From there, you will see a psql instance. Run your table commands here
	* For this project, `CREATE TABLE movies (id SERIAL, title VARCHAR(35), votes INT);` will create the same database
3) Ensure your config variables match
* Ensure that your heroku database URL and Slack API keys match up in your Heroku app dashboard
4) Finally, deploy your code
* You can deploy by commiting to the remote heroku master branch
	* You do this by running `git push heroku master`
	* You must have the Heroku Toolbelt to be able to hook into the Heroku remote branch