var mongoose = require('mongoose') //You connect to the database through mongoose, not a mongoDB library/module.
var Schema = mongoose.Schema

var RoomSchema = mongoose.Schema({
	name: {
		type: String,
		required: [true, "Name is required"],
		unique: true,
	},
	owner: {
		type: Schema.ObjectId,
		ref: 'User',
		required: [true, "Id is required"], //Is alleady a hash
	},
	people: [{type: Schema.ObjectId, ref: 'User'}],
	image: {
		type: String, 
		required: [true, "Image is required"], //Is alleady a hash
	}
})



var room = module.exports = mongoose.model('Room', RoomSchema)