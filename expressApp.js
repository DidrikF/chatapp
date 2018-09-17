/* Main modules */
let express = require('express'); //Requiring the express framework, the minimalistic and unopinonated node server framework, doing routing, middleware, dealing with requests and responses
let mongoose = require('mongoose')

/* Middleware */
let path = require('path') //A node module providing utilities for working with file and directory paths (There are differences in how Windows and POSIX paths are handles, but also ways to make results consitent accross operating systems)
let favicon = require('serve-favicon') //Node.js middleware for serving a favicon.
let logger = require('morgan'); //HTTP request logger middleware for node.js
let bodyParser = require('body-parser'); //Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
let cookieParser = require('cookie-parser'); //Parse Cookie header and populate req.cookies with an object keyed by the cookie names.

/* Models*/
let User = require('./models/User.model')

/* Creating an express application object */
let app = express()


app.set('views', path.join(__dirname, 'frontend','views'))

app.set('view engine', 'pug') 

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico'))) 

app.use(logger('dev')) 

app.use(express.static(path.join(__dirname, 'public')))

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({ extended: false }))

app.use(cookieParser()) //Parse Cookie header and populate req.cookies with an object keyed by the cookie names.

/* Register router */
let router = express.Router();

/* GET home page. */
router.get('/', function(request, response) {
  response.render('application', { title: 'Vue-Socket' });
})

/* Registration, Login, Logout */
router.post('/auth/register', function (request, response) {
  let user = new User({
    username: request.body.username,
    password: request.body.password
  })

  user.save()
  .then(function (user) {
    console.log('### '+user.username+' registered successfully!')
    response.status(200).send({message: 'Registration successful'})
  })
  .catch(function (error) {
   response.status(400).send({error: error})
  })

})

router.post('/auth/login', function (request, response) {
  User.findOne({username: request.body.username}).exec()
  .then(function (user) {
    if(user.password == request.body.password) {
      response.status(200).cookie("Authorization", user._id).send({user: user, authenticated: true, message: "You are now logged in!"})
      return
    }
    response.status(400).send({error: 'Wrong password'})
  })
  .catch(function (error) {
    response.status(400).send({error: error})
  })
})

router.post('/auth/logout', function (request, response) {
  return response.status(200).send({authenticated: false})
})


app.use(router)


/* 
* Not found error creation 
* No route dealt with the request, so we create an Error to be dealt with by error handling middleware (4 params)
*/

app.use(function(request, respons, next) {
  error.status = 404
  next(error)
})



/* 
* ERROR HANDLING MIDDLEWARE
* Validation, MongoDB, JavaScript Code, stuff that has been thrown
*/

//HOW TO DISTINGUISH ERRORS?

/* Validation Handling */

app.use(function (error, request, response, next) {
  //error from mongoose is instance of Error
  
  if(error.name === 'ValidationError') { //mongoose validation error signature
    for (var field in error.errors) {
      if (error.errors.hasOwnProperty(field)) {
          delete error.errors[field].stack  //removing error stack from users output, this is not relevant for logging services..
          delete error.errors[field].properties
          //console.log(error.errors[field])
      }
    }
    return  response.status(400).send(error.errors) 
  }

  next(error)
})


/* Logging/Reporting */
app.use(function (error, request, response, next) {
  //Send to logging service etc. sendToLogginServece(error, request, response)
  //console.error(error.stack)
  next(error)
})

/* MongoDB Errors */
app.use(function (error, request, response, next) {
  if(error.name === 'MongoError') {
    console.log('MongoDB Error middleware: There was a MongoDB Error!')
  }
  next(error)
})

/* 404 - Not Found */
app.use(function(error, request, response, next) {
  if(error.status === 404) {
    response.locals.message = error.message 
    response.locals.error = request.app.get('env') === 'development' ? error : {}
    
  	return response.status(error.status).render('errors/404') //'errors/'+error.status
  }
  next(error)
})

/* Final - Catch All */
app.use(function (error, request, response, next) {
  if (response.headersSent) { //Have not understood yet, but is for the sake of express default error handing middleware
    return next(error)
  }
  response.status(error.status || 500)
  response.send(error)
  //response.render('error', { error: "A server error occured, we appologize for the inconvenience." }) /* render this regardless */
})


module.exports = app;






