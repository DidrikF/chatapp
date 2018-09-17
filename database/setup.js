let mongoose = require('mongoose')
let debug = require('debug')

/*
* Database connection
* The same instance of mongoose should be served by node to other modules
*/

mongoose.Promise = global.Promise;
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true })
.then(function(db) {
  /* Use `db`, for instance `db.model()`*/
})
.catch((error) => {
  debug("Mongoose error: " + error)
})