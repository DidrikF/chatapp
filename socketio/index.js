var socketio = require('socket.io');
var User = require('../models/User.model')

module.exports = function (server){
	var io = socketio.listen(server)
		
	io.on('connection', function(socket) {
		console.log('# Socket ID: ' + socket.id + ' connected to /')
		
		socket.on('event', function (data) {	//none are working, dont know why
			console.log(data)
		})
	})

	require('./root')(io)
	
	/* Features */
	require('./chat')(io)

	return io;
};

