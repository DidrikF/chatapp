

/**
 * Normalize a port into a number, string, or false.
 */
module.exports.normalizePort = function (val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}


/** 
* Check if a user owns a given resource
*/
module.exports.userOwnResource = function (user, resource) {


}
