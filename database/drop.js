var mongoose = require('mongoose')
require('dotenv').config()

let Room = require('../models/Room.model')
let User = require('../models/User.model')
let ChatHistory = require('../models/ChatHistory.model')
let WhisperChatHistory = require('../models/WhisperChatHistory.model')


mongoose.Promise = global.Promise;
mongoose.connect(process.env.DATABASE_URL, {
  useMongoClient: true
})
.then(function(db) {

	ChatHistory.collection.drop( function(error) {
	    if(error) {
	    	console.log('ChatHistory collection drop failed. With error: ' + error)
	    } else {
	    	console.log('ChatHistory collection dropped');
	    }
	})

	WhisperChatHistory.collection.drop( function(error) {
	    if(error) {
	    	console.log('WhisperChatHistory collection drop failed. With error: ' + error)
	    } else {
	    	console.log('WhisperChatHistory collection dropped');
	    }
	})

	Room.collection.drop( function(error) {
	    if(error) {
	    	console.log('Room collection drop failed. With error: ' + error)
	    } else {
	    	console.log('Room collection dropped');
	    }
	})

	User.collection.drop( function(error) {
	    if(error) {
	    	console.log('User collection drop failed. With error: ' + error)
	    } else {
	    	console.log('User collection dropped');
	    }
	})
})
.catch((error) => {
	console.log('Failed to connect to the database')
	console.log(error)
})
