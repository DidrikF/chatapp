var socketio = require('socket.io');
var User = require('../models/User.model')

module.exports = function (server){
	var io = socketio.listen(server)
		
	io.on('connection', function(socket) {
		console.log('# Socket ID: ' + socket.id + ' connected to /')
	})
	
	/* Features of the App */
	require('./chat')(io)

	return io;
};

