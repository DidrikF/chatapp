var mongoose = require('mongoose')
var Schema = mongoose.Schema


var UserSchema = mongoose.Schema({
	username: {
		type: String,
		required: [true, "Username is required"],
		unique: true,
	},
	password: {
		type: String,
		required: [true, "Password is required"], //Is alleady a hash
		select: false,
	},
	image: {
		type: String,
		required: [true, "An avatar is required"], //Is alleady a hash
	},
	inRooms: [{type: Schema.ObjectId, ref: "Room"}],
})

var user = module.exports = mongoose.model('User', UserSchema)












