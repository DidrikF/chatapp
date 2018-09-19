var mongoose = require('mongoose')
require('dotenv').config()
const moment = require('moment')
const Room = require('../models/Room.model')
const User = require('../models/User.model')
const Message = require('../models/Message.model')

 

mongoose.Promise = global.Promise;
mongoose.connect(process.env.DATABASE_URL).then(async (db) => {

	var chatapp = await new User({
		username: 'chatapp',
		password: 'password123',
		image: 'images/bot.png'
	}).save()
	var alexbot = await new User({
		username: 'Alex Bot',
		password: 'password123',
		image: 'images/bot.png'
	}).save()

	console.log('created user')
	const globalRoom = await new Room ({
		image: 'images/rooms/pets_dogs_animals.png',
		name: 'Global',
		owner: chatapp,
	}).save()
	console.log('created global')
	const gamingRoom = await new Room({
		image: 'images/rooms/pets_dogs_animals.png',
		name: 'Gaming',
		owner: chatapp,
	}).save()
	console.log('created gaming')
	const codingRoom = await new Room({
		image: 'images/rooms/pets_dogs_animals.png',
		name: 'Coding',
		owner: chatapp,
	}).save()
	console.log('created coding')

	chatapp.set({inRooms: [globalRoom._id]})
	await chatapp.save()


	// create some messages
	const message1 = new Message({
		sender: chatapp._id,	// {type: Schema.ObjectId, ref: 'User'},
		body: 'Hi Alex Bot',	// {type: String},
		time: moment().format('MMMM Do YYYY, h:mm:ss a'),	// {type: Date},
		type: 'room',	// {type: String, emum: ["room","whisper"]},
		room: globalRoom._id,	// {type: Schema.ObjectId, ref: 'Room'},
	})

	const message2 = new Message({
		sender: alexbot._id,	// {type: Schema.ObjectId, ref: 'User'},
		body: 'Hi Chatapp',	// {type: String},
		time: moment().format('MMMM Do YYYY, h:mm:ss a'),	// {type: Date},
		type: 'room',	// {type: String, emum: ["room","whisper"]},
		room: globalRoom._id,	// {type: Schema.ObjectId, ref: 'Room'},
	})

	const message3 = new Message({
		sender: chatapp._id,	// {type: Schema.ObjectId, ref: 'User'},
		body: 'You are the best!',	// {type: String},
		time: moment().format('MMMM Do YYYY, h:mm:ss a'),	// {type: Date},
		type: 'room',	// {type: String, emum: ["room","whisper"]},
		room: globalRoom._id,	// {type: Schema.ObjectId, ref: 'Room'},
	})

	const message4 = new Message({
		sender: alexbot._id,	// {type: Schema.ObjectId, ref: 'User'},
		recipient: chatapp._id,	// {type: Schema.ObjectId, ref: 'User'},
		body: 'Hi Chatapp',	// {type: String},
		time: moment().format('MMMM Do YYYY, h:mm:ss a'),	// {type: Date},
		type: 'whisper',	// {type: String, emum: ["room","whisper"]},
	})

	const message5 = new Message({
		sender: chatapp._id,	// {type: Schema.ObjectId, ref: 'User'},
		recipient: alexbot._id,	// {type: Schema.ObjectId, ref: 'User'},
		body: 'You are the best!',	// {type: String},
		time: moment().format('MMMM Do YYYY, h:mm:ss a'),	// {type: Date},
		type: 'whisper',	// {type: String, emum: ["room","whisper"]},
	})

	await Promise.all([
		message1.save(),
		message2.save(),
		message3.save(),
		message4.save(),
		message5.save()
	])
	console.log('created messages')


	console.log('DONE! exiting...')
	process.exit()
})