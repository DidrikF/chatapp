var mongoose = require('mongoose')
var Schema = mongoose.Schema

var WhisperChatHistorySchema = mongoose.Schema({
	recipient: {type: Schema.ObjectId, ref: 'User'},
	sender: {type: Schema.ObjectId, ref: 'User'},
	body: {type: String},
	time: {type: Date}
})

var whisperChatHistory = module.exports = mongoose.model('WhisperChatHistory', WhisperChatHistorySchema)

