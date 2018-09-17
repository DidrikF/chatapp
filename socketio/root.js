
module.exports = function (io) {

	var rootNsp = io.of('/root')

	rootNsp.on('connection', function (socket) {

		console.log('# Socket ID: ' + socket.id + ' connected to /root.')

	  	socket.on('error', function (error) {
    		console.log("there was an error: " + error)
 		})


		socket.on('disconnect', function () {
			console.log('socket disconnected from /root')

		})

		socket.on('reloadConnection', function() {
			console.log('reloadConnection called')
			socket.disconnect(true)
		})
	})


}
	
	