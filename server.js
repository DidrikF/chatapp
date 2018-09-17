/* Register environment variables */
require('dotenv').config()

let debug = require('debug')('vue-socket:server') //By passing the name of the current module to the debug function, it will prefix debug messages with the modules name, makes it easier to read the debug output in the terminal.

/* Global functions, objects and variables */
global.rootRequire = function(name) {
    return require(__dirname + '/' + name);
}

/* Node modules */
let http = require('http') //To use the HTTP server and client one must require('http').
const { normalizePort } = require('./helpers')

/* Database setup */
require('./database/setup')


/* Express setup - The request handler object passed to the Node Http server*/
var app = require('./expressApp')


/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(process.env.PORT || '3000')
app.set('port', port);

/**
 * Create HTTP server.
 */
var server = http.createServer(app)

/* Socket.io */
var io = require('./socketio')(server) //Passing objects to the file which is exporting a function

/**
 * Listen on provided port, on all network interfaces.
 */

/* Register server event listeners */
server.on('error', onError) //The server inherits from EventEmitter, or is a stream
server.on('listening', onListening)

/* Make server accessable */
server.listen(port)


/**
 * Event listener for HTTP server "error" event.
 */

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

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  let addr = server.address();
  let bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}