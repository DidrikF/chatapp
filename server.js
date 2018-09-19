require('dotenv').config()

let debug = require('debug')('vue-socket:server')

global.rootRequire = function(name) {
    return require(__dirname + '/' + name);
}

let http = require('http')
const { normalizePort } = require('./helpers')

require('./database/setup')


var app = require('./expressApp')



var port = parseInt(process.env.PORT, 10)
app.set('port', port);


var server = http.createServer(app)


var io = require('./socketio')(server) //Passing objects to the file which is exporting a function


server.on('error', onError) 
server.on('listening', onListening)


server.listen(port)


function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  let bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
		console.error(bind + ' requires elevated privileges');
      	process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  let addr = server.address();
  let bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}