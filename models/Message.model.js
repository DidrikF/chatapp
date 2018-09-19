var mongoose = require('mongoose')
var Schema = mongoose.Schema

var MessageSchema = mongoose.Schema({
	recipient: {type: Schema.ObjectId, ref: 'User'},
	sender: {type: Schema.ObjectId, ref: 'User'},
	body: {type: String},
	time: {type: String},
	type: {
		type: String,
		emum: ["room","whisper"]
	},
	room: {type: Schema.ObjectId, ref: 'Room'},
})

var Message = module.exports = mongoose.model('Message', MessageSchema)

