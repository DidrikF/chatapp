var mongoose = require('mongoose')
var Schema = mongoose.Schema

var ChatHistorySchema = mongoose.Schema({
	roomId: {
		type: Schema.ObjectId,
		ref: 'Room',
		required: [true, "Chat must belong to a room"],
		unique: true
	},
	messages: [
		{
			sender: {type: Schema.ObjectId, ref: 'User'},
			body: {type: String},
			time: {type: Date}
		}
	]
})

var chatHistory = module.exports = mongoose.model('ChatHistory', ChatHistorySchema)
