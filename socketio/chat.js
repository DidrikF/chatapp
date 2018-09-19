let Room = require('../models/Room.model')
let User = require('../models/User.model')
let Message = require('../models/Message.model')
var cookie = require('cookie')
var { isEmpty } = require('lodash')
const jwt = require('jsonwebtoken')
const moment = require('moment')

// How is error handling dealt with, next(error)


module.exports = function (io) {
	
	chat = io.of('/chat')

	chat.use((socket, next) => {
		if(!socket.request.headers.cookie && !socket.request.headers.cookie['Authorization']) {
		  	return next(new Error('Unauthorized'))	
		}
		var token = cookie.parse(socket.request.headers.cookie)['Authorization']

		try {
			var decoded = jwt.verify(token, process.env.JWT_SECRET)
		} catch (error) {
			// console.log('INVALID TOKEN IN UPGRADE REQUEST')
			next(error)
			return
		}

		// console.log(decoded)
		const userId = decoded.data._id;

		User.findById(userId).exec()
		.then(function (user) {
			if(user){
				socket.request.user = user
				next()	
			}
			next(new Error('Unauthorized'))
		})
		.catch(function (error) {
			console.log("Error in socket.io /chat middleware: " + error)
		})
	})


	/*
	chat.on('error', (error) => {
		console.log(error)
	})
	*/

	chat.on('connection', function (socket) {
		// console.log('# Socket ID: ' + socket.id + ' connected to /chat.')

		// MIDDLEWARE
		socket.use(function (packet, next) {
			try {
				var decoded = jwt.verify(packet[1].jwt, process.env.JWT_SECRET)
				next()
			} catch (error) {
				console.log('INVALID TOKEN IN WEBSOCKET PACKET')
				next(error)
			}
		})

		// TELL OTHER THE USER CONNECTED
		User.findById(socket.request.user._id).exec()
		.then(function(user) {
			chat.emit("userCameOnline", user)	
		})


		// EVENT HANDLERS

		socket.on('joinChat', async (name, device) => {
			try {
				const user = socket.request.user

				var onlineUserIds = await new Promise(function (resolve, reject) {
					chat.clients((error, clients) => {
						if(error) reject(new Error("Unable to retreve chat namespaced clients"))
						
						let onlineUserIds = []
						clients.forEach(function (clientId) {
							if(chat.connected[clientId].request.user && (chat.connected[clientId].request.user._id !== socket.request.user._id)) {
								onlineUserIds.push(chat.connected[clientId].request.user._id)
							}
						})
						resolve(onlineUserIds)
					})
				})

				const bot = await User.findOne({username: 'Alex Bot'}).exec()
				onlineUserIds.push(bot._id)
				const onlineUsers = await User.find({'_id': { $in: onlineUserIds }}).exec()
				const rooms = await Room.find({}).populate('people', 'username').populate('owner', 'username').exec()

				
				const messages = await Message.find({
					$or:[ 
						{'recipient': user._id}, 
						{'sender': user._id}, 
						{'room': { $in: user.inRooms } }
					]
				}).populate('sender', 'username').populate('recipient', 'username').exec()
				
				socket.emit('test', null) // WHAT THE FLYING F***
				socket.emit('rooms', rooms)
				socket.emit('onlineUsers2', onlineUsers)
				socket.emit("messages", messages)
				
				const roomsTheUserIsIn = await Room.find({_id: { $in: user.inRooms}}).populate('people', 'username').populate('owner', 'username').exec()

				roomsTheUserIsIn.forEach(function (room) {
					socket.join(room.name, function(error) {
						if(error) {
							// console.log(user.username + ' failed to joind room ' + room.name)
							return
						}
						// console.log(user.username + ' joined room ' + room.name)

						chat.to(room.name).emit("userJoinedRoom", {
							user: user,
							room: room,
							messages: []
						})
					})
				})
			} catch (err) {
				console.log('### JOINCHAT ERROR', err)
			}
		})

		socket.on("sendToUser", async (data) => {
			const bot = await User.findOne({username: 'Alex Bot'}).exec()
			if (data.message.recipient+'' === bot._id+'') {
				var [ messageToBot, messageFromBot] = await Promise.all([new Message({
						recipient: data.message.recipient,
						sender: data.message.sender,
						time: moment().format('MMMM Do YYYY, h:mm:ss a'),
						body: data.message.body,
						type: 'whisper'
					}).save(), new Message({
						recipient: data.message.sender,
						sender: data.message.recipient,
						time: moment().format('MMMM Do YYYY, h:mm:ss a'),
						body: 'That was such a funny message!',
						type: 'whisper'
					}).save()

				]);


				[messageToBot, messageFromBot] = await Promise.all([
					Message.findById(messageToBot._id).populate('sender', 'username').populate('recipient', 'username').exec(),
					Message.findById(messageFromBot._id).populate('sender', 'username').populate('recipient', 'username').exec()
				]);

				socket.emit("newMessage", messageToBot)
				socket.emit("newMessage", messageFromBot)
				return
			}

			try {
				var clientId = await new Promise(function (resolve, reject) {
					chat.clients((error, clients) => {
						if(error) reject(new Error("Unable to retreve chat namespaced clients"))
						clients.forEach(function (clientId) {
							if(chat.connected[clientId].request.user._id+'' === data.message.recipient+'') {
								resolve(clientId)
							}
						})
						reject(new Error("Unable to find the recipient socket"))
					})
				})

				var message = await new Message({
					recipient: data.message.recipient,
					sender: data.message.sender,
					time: moment().format('MMMM Do YYYY, h:mm:ss a'),
					body: data.message.body,
					type: 'whisper'
				}).save()
				message = await Message.findById(message._id).populate('sender', 'username').populate('recipient', 'username').exec()

				socket.broadcast.to(clientId).emit("newMessage", message)
				socket.emit("newMessage", message)

			} catch (err) {
				console.log(err)
			}
		})

		socket.on("sendInRoom", async (data) => {
			try {
				let isInRoom = Object.keys(socket.rooms).find(function (roomName) {
					return roomName === data.room.name
				})
	
				if(!isInRoom) {
					return
				}
				let message = await new Message({
					sender: data.message.sender,
					time: moment().format('MMMM Do YYYY, h:mm:ss a'),
					body: data.message.body,
					type: 'room',
					room: data.room._id
				}).save()
				message = await Message.findById(message._id).populate('sender', 'username').populate('recipient', 'username').exec()
	
				chat.in(data.room.name).emit("newMessage", message)
			} catch (err) {
				console.log(err)
			}
		})


		socket.on("joinRoom", async (data) => {
			let room = data.room
			try {
				let user = await User.findById(socket.request.user._id).exec()
				room = await Room.findById(room._id).exec()
				
				let userInRoom = room.people.find((userId) => {
					return userId+'' === user._id+''
				})
				if (userInRoom) return

				room.people.push(user._id)

				room = await room.save()
				room = await Room.findById(room._id).populate('people', 'username').populate('owner', 'username').exec()
				
				let inRoom = user.inRooms.indexOf(room._id)
				if(inRoom < 0) user.inRooms.push(room._id)

				user = await user.save()

				const messages = await Message.find({room: room._id}).populate('sender', 'username').exec()
				// console.log('joinRoom messages: ', messages)
				socket.join(room.name, function (error) {
					if(error) return Promise.reject(new Error("The socket is allready in room: " + room.name))
					// console.log(user.username + ' joined room: ' + room.name)
					//update everyone in the room (including yourself) about the new "user list"
					chat.to(room.name).emit("userJoinedRoom", {
						user: user,
						room: room,
						messages: messages
					})
				})

			} catch (err) {
				socket.emit("errorMessage", error.message)
			}

		})
		
		socket.on("leaveRoom", async (data) => {
			try {
				let room = await Room.findById(data.room._id).exec()
				let user = await User.findById(socket.request.user._id).exec()
	
				socket.leave(room.name, async (error) => {
					if (error) {
						// console.log(socket.request.user._id+" failed to leave room "+room.name)
						return 
					}
					let indexToRemove = room.people.indexOf(user._id)
					room.people.splice(indexToRemove, 1)
					room = await room.save()
					room = await Room.findById(room._id).populate('people', 'username').populate('owner', 'username').exec()
					// Tell others in the room and update their rooms
					chat.to(room.name).emit("userLeftRoom", {
						room: room
					})
	
					indexToRemove = user.inRooms.indexOf(room._id)
					user.inRooms.splice(indexToRemove, 1)
					user = await user.save()

					socket.emit("youLeftRoom", {
						user: user,
						room: room
					})
				})
			} catch (err) {
				console.log("Error when leaving room: ", err)
			}

		})

		socket.on('disconnect', function () {
			User.findById(socket.request.user._id).exec()
			.then(function(user) {
				chat.emit('userWentOffline', user)
			})
		})

		socket.on("createRoom", async (data) => {
			try {
				let room = await new Room({
					name: data.room.name,
					owner: socket.request.user._id,
					people: [],
					image: data.room.image
				}).save()
				
				room = await Room.findById(room._id).populate('owner', 'username').exec()
				
				chat.emit('newRoom', room)
			} catch (err) {
				console.log(err)
				//socket.emit("errorMessage", error.message)
			}
		})


		socket.on("deleteRoom", async (data) => {
			let room = data.room
			if (room.owner._id+'' !== socket.request.user._id+'') {
				// console.log('User cannor remove room he does not own!')
				return
			}
			chat.clients((error, clients) => {
				if(error) {
					// console.log(error)
					return
				}
				clients.forEach(function (clientId) {
					// console.log("clientId: "+clientId+", leaving room")
					chat.connected[clientId].leave(room.name, function (error) {
						if(error) return	//this is not working
						// console.log(chat.connected[clientId].request.user.username+' removed from room: '+room.name)
					})
				})
			})

			let users = await User.find({inRooms: room._id}).exec() //ownedRooms is an array, but this still works :)
			users.forEach(function(user) {
				let indexToRemove = user.inRooms.indexOf(room._id)
				if(indexToRemove > -1) {
					user.inRooms.splice(indexToRemove, 1)
					user.save()
				}
			})

			Room.remove({_id: room._id}, function(error) {
				if(error) {
					// console.log("#removeRoom error: " + error)
					return
				}
				chat.emit('roomRemoved', room)
			})
		})

	})
}