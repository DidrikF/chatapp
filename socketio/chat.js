let Room = require('../models/Room.model')
let User = require('../models/User.model')
let ChatHistory = require('../models/ChatHistory.model')
let WhisperChatHistory = require('../models/WhisperChatHistory.model')
var cookie = require('cookie')
var { isEmpty } = require('lodash')


// How is error handling dealt with, next(error)


module.exports = function (io) {
	
	chat = io.of('/chat') //	in/of are the same

	// namespace middleware
	chat.use((socket, next) => {
		//console.log('Socket.io auth middleware called!')
		var userId = null
		if(!socket.request.headers.cookie) {
			//console.log('No cookie associated with socket')
		  	return next(new Error('Unauthorized'))	
		}

		var parsedCookie = cookie.parse(socket.request.headers.cookie)['Authorization']
		
		//console.log(parsedCookie)

		if(parsedCookie) {
			//console.log('parsedCookie: ' + parsedCookie)
			userId = parsedCookie.substring(parsedCookie.indexOf("\"")+1,parsedCookie.lastIndexOf("\"")) // Not very elegant
		}

		User.findById(userId).exec()
		.then(function (user) {
			if(user){
				socket.request.user = user
				next()	
			}
			next(new Error('Unauthorized'))
		})
		.catch(function (error) {
			console.log("socket.io /chat middleware: " + error)
		})

	})

	chat.on('connection', function (socket) {
		console.log('# Socket ID: ' + socket.id + ' connected to /chat.')

		// socket middleware
		socket.use(function (packet, next) {
			//console.log(packet) //just [ 'need-auth', { message: 'I need to be authenticated' } ]
			if(!socket.request.user) {
				return next(new Error('Unauthorized'))
			} else {
				next()
			}
		})

		User.findById(socket.request.user._id, ['username']).exec()
		.then(function(user) {
			chat.emit("userCameOnline", user)	
		})
		
		socket.on('joinChat', function (name, device) {
			
			console.log('#joinChat : ' + socket.request.user._id)
			
			var onlineUserIds = []

			var userIdsPromise = new Promise(function (resolve, reject) {
				chat.clients((error, clients) => {
					if(error) reject(new Error("Unable to retreve chat namespaced clients"))

					clients.forEach(function (clientId) {
						if(chat.connected[clientId].request.user) {
							onlineUserIds.push(chat.connected[clientId].request.user._id)
						}
					})
					resolve(onlineUserIds)
				})
			})

			userIdsPromise
			.then(function (onlineUserIds) {
				return Promise.all([
					Room.find({owner: {$ne: socket.request.user._id}}).populate('people', 'username').populate('owner', 'username').exec(),
					Room.find({owner: socket.request.user._id}).populate('people', 'username').populate('owner', 'username').exec(),
					User.find({'_id': { $in: onlineUserIds }}, ['username', 'image']).exec()
				])
			})
			.then((results) => {
				socket.emit("publicRooms", results[0])
				socket.emit("ownedRooms", results[1])
				socket.emit("onlineUsers", results[2])

				return User.findById(socket.request.user._id).exec()
			})
			.then(function (user) {
				return ChatHistory.find({roomId: { $in: user.inRooms }}).populate('messages.sender', 'username').exec()
			})
			.then(function(chatHistoryEntries) {
				let chatHistoryFormatted = {}
				chatHistoryEntries.forEach(function(entry) {
					chatHistoryFormatted[entry.roomId] = entry.messages
				})

				socket.emit("roomChatHistories", chatHistoryFormatted)
			})
			.catch(function(error) {
				console.log("#joinChat Error: " + error)
			})

			//join user to rooms he is in (database persists this)
			User.findById(socket.request.user._id).exec()
			.then(function (user) {
				return Room.find({_id: { $in: user.inRooms}}).exec()
			})
			.then(function (rooms) {
				console.log("User socket supposed to join rooms...")
				//console.log(rooms)
				rooms.forEach(function (room) {
					console.log(room.name)
					socket.join(room.name, function(error) {
						if(error) {
							console.log(socket.request.user.username + ' failed to joind room ' + room.name)
							return
						}
						console.log(socket.request.user.username + ' joined room ' + room.name)
						//Tell member of the room that a user connected:


					})
				})
			})
			.catch(function(error) {
				console.log("#joinChat Error: " + error)
				//socket.emit("errorMessage", error)
			})

			//Send whisperChatHistory where user is either sender or recipient
			WhisperChatHistory.find( { $or:[ {'recipient': socket.request.user._id}, {'sender': socket.request.user._id} ]} ).populate('recipient', 'username').populate('sender', 'username').exec()
			.then(function(messages) {
				if(isEmpty(messages)) return 
				socket.emit("whisperChatHistory", messages)
			})

		})


		socket.on("joinRoom", function (formattedRoom) {
			Room.findById(formattedRoom._id).exec() //.populate('people', 'username').populate('invitedPeople', 'username').populate('owner', 'username')
			.then(function (room) {
				//When not to add a person to a room...
				//console.log(room)
				let userInRoom = room.people.find(function (userId) {
					return userId+'' === socket.request.user._id+''
				})
				if(userInRoom) return Promise.reject(new Error("You are allready in that room."))
				if(room.private === true) return Promise.reject(new Error("That room is private."))
				if(room.status !== 'available') return Promise.reject(new Error("That room is not available."))
				if(room.people.length >= room.peopleLimit) return Promise.reject(new Error("That room is full."))
				
				//add user to room in database, for persistance accross sessions
				room.people.push(socket.request.user._id)

				return room.save()
			})
			.then(function (room) {
				return Promise.all([
					User.findById(socket.request.user._id).exec(),
					Room.findById(room._id).populate('people', 'username').populate('owner', 'username').exec()
				])
			})
			.then(function(userAndRoom) {
				//Add roomId to user.inRooms IF HE IS NOT ALLREAY IN THE ROOM
				let [user, room] = userAndRoom
				let inRoom = user.inRooms.find(function (roomId) {
					return roomId+'' === room._id+''
				})
				console.log("inRoom: "+inRoom)
				if(isEmpty(inRoom)) user.inRooms.push(room._id)
				
				return Promise.all([
						user.save(),
						room,
						ChatHistory.findOne({roomId: room._id}).populate('messages.sender', 'username').exec()
					])
			})
			.then(function (userAndRoomAndChatHistory) {
				let [user, room, chatHistory] = userAndRoomAndChatHistory
				console.log(user.inRooms)
				//Join socket to room
				socket.join(room.name, function (error) {
					if(error) return Promise.reject(new Error("The socket is allready in room: " + room.name))
					
					//update everyone in the room (including yourself) about the new "user list"
					//console.log(user, room, chatHistory)
					chat.to(room.name).emit("userJoinedRoom", {
						user: user,
						room: room,
						chatHistory: chatHistory
					})
				})
				
			})
			.catch(function (error) {
				socket.emit("errorMessage", error.message)
				//Clean up failed attempt...
			})
		})

		socket.on("leaveRoom", function(room) {
			//remove socket from room
			Room.findById(room._id).exec()
			.then(function(room) {
				//remove from room.people
				let indexToRemove = room.people.indexOf(socket.request.user._id)
				room.people.splice(indexToRemove, 1)
				console.log("was user removed from room.people: "+room.people.indexOf(socket.request.user._id))

				return room.save()
			})
			.then(function(room) {
				socket.leave(room.name, function(error) {
					if(error) {
						console.log(socket.request.user._id+" failed to leave room "+room.name)
						return
					}
					//room removed from socket.rooms
				})
				//I might announce that a user has leaft without having successfully removed the room from the socket	
				return Room.findById(room._id).populate('people', 'username').populate('invitedPeople', 'username').populate('owner', 'username').exec()
			})
			.then(function(room){
				chat.emit("userLeftRoom", {
					room: room
				})
			})
			.catch(function(error) {
				console.log("#leaveRoom Error: " + error)
			})
		
			//remove room from user.inRooms
			User.findById(socket.request.user._id).exec()
			.then(function(user) {
				console.log("user in rooms: "+user.inRooms)
				console.log("RoomId to remove: "+room._id)
				let indexToRemove = user.inRooms.indexOf(room._id)
				user.inRooms.splice(indexToRemove, 1)
				console.log("after removal: "+user.inRooms)
				return user.save()
			})
			.catch(function(error) {
				console.log("#leaveRoom Error: " + error)
			})
		})


		socket.on("createRoom", function (input) {
			//make sure name is unique
			Room.findOne({name: input.name}).exec()
			.then(function(room) {
				if(room) return Promise.reject(new Error("That name is allready taken"))

				//Create room
				let newRoom = new Room({
					name: input.name,
					owner: socket.request.user._id,
					people: [],
					image: input.image || "https://api.adorable.io/avatars/140/abott@adorable.png"
					/*
					peopleLimit: input.peopleLimit,
					status: input.status,
					private: input.private,
					invitedPeople: []
					*/
				})

				return newRoom.save()
			})
			.then(function(savedRoom) {
				//Create chat history for room
				let newChatHistory = new ChatHistory({
					roomId: savedRoom._id,
					messages: []
				})
				return Promise.all([
					newChatHistory.save(), 
					Room.findById(savedRoom._id).populate('owner', 'username').exec()
				])
			})
			.then(function(results) {
				var [savedChatHistory, savedRoom] = results
				//no need to populate people, invitedPeople or messages.sender, becuase there are none
				
				//update users room lists and chat histories
				if(savedRoom.private || savedRoom.status !== "available") {
					socket.emit('newRoom', {
						room: savedRoom
					})
				}
				if(!savedRoom.private && savedRoom.status === "available") {
					chat.emit('newRoom', {
						room: savedRoom	
					})
				}
			})
			.catch(function(error) {
				socket.emit("errorMessage", error.message)
			})


		})


		socket.on("removeRoom", function (room) {
			console.log("removing room: "+room.name)
			console.log(room.owner._id, socket.request.user._id)
			if(room.owner._id+'' !== socket.request.user._id+'') {
				socket.emit("errorMessage", "You cannot remove a room you do not own.")
				return
			}
			//make all sockets leave the room
				//Tell the once disconnected about the room being removed ----------
			chat.clients((error, clients) => {
				if(error) console.log(error)
				clients.forEach(function (clientId) {
					console.log("clientId: "+clientId+", leaving room")
					chat.connected[clientId].leave(room.name, function (error) {
						if(error) return	//this is not working
						console.log(chat.connected[clientId].request.user.username+' removed from room: '+room.name)
					})
				})
			})

			//remove room from all user.inRooms 
		
			User.find({inRooms: room._id}).exec() //ownedRooms is an array, but this still works :)
			.then(function (users) {
				if(!users) return Promise.reject(new Error("No users in the room: "+room._id))
				users.forEach(function(user) {
					let indexToRemove = user.inRooms.indexOf(room._id)
					if(indexToRemove > -1) {
						user.inRooms.splice(indexToRemove, 1)
						console.log(user.inRooms)
						user.save()
					}
				})

			})
			.catch(function (error) {
				console.log("#removeRoom error: " + error)
			})


			//delete chat history for the room
			ChatHistory.remove({roomId: room._id}).exec()
			.then(function() {
				console.log('Chat history removed from database')
			})
			.catch(function(error) {
				console.log("#removeRoom error: " + error)
			})

			//delete room
			Room.remove({_id: room._id}, function(error) {
				if(error) {
					console.log("#removeRoom error: " + error)
					return
				}
				//removed
				console.log('Room removed and emitting: roomRemoved')
				chat.emit('roomRemoved', {
					room: room
				})
			})

			//update all members of the room
				//make them delete the room
				//make them delete the chat history
				//make the owner update his user //MAY NOT APPLY AS I DONT HAVE A PROPPER USER OBJECT IN THE CLIENT

		})
		

		socket.on("sendInRoom", function(data) {
			//confirm socket is in room
			//console.log(socket.rooms) //{ '/chat#n9YEUlYjLYSuUJDgAAAB': '/chat#n9YEUlYjLYSuUJDgAAAB' }

			let isInRoom = Object.keys(socket.rooms).find(function (roomName) {
				return roomName === data.room.name
			})

			if(!isInRoom) {
				console.log("user trying to send message in room he is not in")
				return
			}

			//store message in Chat history
			ChatHistory.findOne({roomId: data.room._id}).exec()
			.then(function(chatHistoryEntry) {
				chatHistoryEntry.messages.push({
					sender: data.message.sender,
					body: data.message.body,
					time: new Date()
				})
				return chatHistoryEntry.save()
			})
			.then(function(chatHistoryEntry) {
				return ChatHistory.findById(chatHistoryEntry._id).populate('messages.sender', 'username').exec()
			})
			.then(function(populatedChatHistory){
				let newFormattedMessage = populatedChatHistory.messages.pop()
				//console.log(newFormattedMessage)
				chat.in(data.room.name).emit("messageInRoom", {
					roomId: populatedChatHistory.roomId,
					message: newFormattedMessage
				})
			})
			.catch(function(error) {
				console.log(error)
			})

			//send message to all sockets in the room
		})

		socket.on("sendToUser", function(data) {
			//Store and update recipient
			let whisperChatHistory = new WhisperChatHistory({
				recipient: data.recipient,
				sender: data.sender,
				body: data.body,
				time: new Date()
			})

			let clientIdPromise = new Promise(function (resolve, reject) {
				chat.clients((error, clients) => {
					if(error) reject(new Error("Unable to retreve chat namespaced clients"))
					console.log(clients)
					clients.forEach(function (clientId) {
						console.log(chat.connected[clientId].request.user._id, data.recipient)
						if(chat.connected[clientId].request.user._id+'' === data.recipient+'') {
							resolve(clientId)
						}
					})
					reject(new Error("Unable to find the recipient socket"))
				})
			})

			whisperChatHistory.save()
			.then(function(message) {
				return Promise.all([
					clientIdPromise,
					WhisperChatHistory.findById(message._id).populate('recipient', 'username').populate('sender', 'username').exec()
				])
			})
			.then(function(clientIdAndMessage) {
				let [clientId, message] = clientIdAndMessage
				//console.log("clientId: "+ clientId)
				//console.log("message: "+ message)
				socket.broadcast.to(clientId).emit("newWhisperMessage", message)
				socket.emit("newWhisperMessage", message)
			})
			.catch(function(error) {
				console.log(error)
			})


		})


		socket.on("fetchUser", function (data) {
			socket.emit("setUser", {
				user: socket.request.user,
				vuex: { namespaced: true, namespace: 'auth'}
			})
		})

		socket.on('disconnect', function () {
			User.findById(socket.request.user._id, ['username']).exec()
			.then(function(user) {
				//console.log(user)
				chat.emit('userWentOffline', user)
			})
			console.log('socket disconnected from /chat')
		})

	})
}

/*
function getRoomChatHistoryForUser(userId) {
	return User.findById(userId).exec()
	.then(function(user) {
		let chatHistoryPromises = []

		let roomChatHistories = {}
		
		user.inRooms.forEach(function (roomId) {
			chatHistoryPromises.push(
				ChatHistory.find({roomId: roomId}).exec()	//MAY NOT WORK
				.then(function(messages) {
					roomChatHistories[roomId] = messages
				}) 
			)
		})
		return Promise.all(chatHistoryPromises)
		.then(function(results){
			console.log(results)
			return Promise.resolve(roomChatHistories)
		})
	})
}
*/
	
/*


router.beforeEach(guard)
router.beforeResolve(guard) (2.5.0+)
router.afterEach(hook)
router.push(location, onComplete?, onAbort?)
router.replace(location, onComplete?, onAbort?)
router.go(n)
router.back()
router.forward()
router.getMatchedComponents(location?)
router.resolve(location, current?, append?)



			User.findById(data.recipient._id).exec()
			.then(function(recipient) {
				if(!user) return Promise.reject(new Error("Failed to recieve message from "+socket.request.user.username))
				recipient.messages.push({
					sender: data.message.sender,
					recipient: data.message.recipient,
					body: data.message.body,
					time: new Date()
				})
				return recipient.save()
			})
			.then(function(recipient) {
				//get socketId of recipient
				return new Promise(function (resolve, reject) {
					chat.clients((error, clients) => {
						if(error) reject(new Error("Unable to retreve chat namespaced clients"))

						clients.forEach(function (clientId) {
							if(chat.connected[clientId].request.user === recipient._id) {
								resolve(clientId, recipient)
							}
						})
					})
				})
			})
			.then(function(socketIdAndRecipient) {
				let [recipientSocketId, recipient] = socketIdAndRecipient
				chat.connected[recipientSocketId].emit('messageFromUser', recipient.messages.pop())
			})
			.catch(function(error) {
				console.log(error)
			})


			//Store and update sender
			User.findById(socket.request.user._id).exec()
			.then(function(sender) {
				if(!user) return Promise.reject(new Error("Failed to send message to "+data.recipient.username))
				sender.messages.push({
					sender: data.message.sender,
					recipient: data.message.recipient,
					body: data.message.body,
					time: new Date()
				})
				return sender.save()
			})
			.then(function(sender) {
				socket.emit('messageFromUser', sender.messages.pop())
			})
			.catch(function(error) {
				console.log(error)
			})

*/