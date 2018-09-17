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
	},
	image: {
		type: String,
	},
	ownedRooms: [{type: Schema.ObjectId, ref: "Room"}],
	inRooms: [{type: Schema.ObjectId, ref: "Room"}],
	// friends: [{type: Schema.ObjectId, ref: "User"}],
	messages: [
		{
			sender: {type: Schema.ObjectId, ref: 'User'},
			body: {type: String},
			time: {type: Date}
		}
	]
})

var user = module.exports = mongoose.model('User', UserSchema)












