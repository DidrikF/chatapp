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

	Promise.all([
		createUser('EmilieF'),
		createUser('DidrikF')
	]).
	then(function(users) {
		let [emilie, didrik] = users
		return Promise.all([
			createRoom("Random", didrik, [emilie._id]),
			createRoom("Work", emilie, [emilie._id, didrik._id]),
			users[0],
			users[1]
		])
	})
	.then(function(results) {
		let [randomRoom, workRoom, emilie, didrik] = results
		emilie.inRooms.push(randomRoom._id)
		emilie.inRooms.push(workRoom._id)
		didrik.inRooms.push(workRoom._id)
		return Promise.all([
			createChatHistory(randomRoom._id, emilie._id, didrik._id),
			createChatHistory(workRoom._id, emilie._id, didrik._id),
			emilie.save(),
			didrik.save()
		])
	})
	.then(function(chatHistories) {
		console.log("# DONE!")
	})
	.catch(function(error) {
		console.log("#Seed error: " + error)
	})

})
.catch((error) => {
	console.log("#DB error: " + error)
})


var createUser = function (username) {
	var user = new User({
		username: username,
		password: "password123",
		ownedRooms: [],
		inRooms: [],
		friends: []
	})

	return user.save()
	.then(function (user) {
		console.log('User seeded to database')
		return Promise.resolve(user)
	})
	.catch(function (error) {
		console.log(error)
	})
}

var createRoom = function (name, ownerId, people) {
	var room = new Room({
		name: name,
		owner: ownerId,
		people: people,
		peopleLimit: 10,
		status: "available",
		private: false,
		invitedPeople: []
	})

	return room.save()
	.then(function(room) {
		console.log("Room seeded to the database")
		return Promise.resolve(room)
	})
	.catch(function (error) {
		console.log(error)
	})

}

var createChatHistory = function (roomId, user1, user2) {
	var chatHistory = new ChatHistory({
		roomId: roomId,
		messages: [
			{
				sender: user1,
				body: "Hello from user1 in " + roomId,
				time: new Date()
			},
			{
				sender: user2,
				body: "Hello from USER2 in " + roomId,
				time: new Date() + 5000
			},
			{
				sender: user1,
				body: "A message from user1 in " + roomId,
				time: new Date() + 10000
			},
			{
				sender: user2,
				body: "Another message from USER2 in " + roomId,
				time: new Date() + 15000
			}
		]
	})

	return chatHistory.save()
	.then(function(chatHistory) {
		console.log("ChatHistory seeded to the database")
		return Promise.resolve(chatHistory)
	})
	.catch(function (error) {
		console.log(error)
	})
}
