/* Main modules */
let express = require('express'); //Requiring the express framework, the minimalistic and unopinonated node server framework, doing routing, middleware, dealing with requests and responses
let mongoose = require('mongoose')

/* Middleware */
let path = require('path') //A node module providing utilities for working with file and directory paths (There are differences in how Windows and POSIX paths are handles, but also ways to make results consitent accross operating systems)
let favicon = require('serve-favicon') //Node.js middleware for serving a favicon.
let logger = require('morgan'); //HTTP request logger middleware for node.js
let bodyParser = require('body-parser'); //Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
let cookieParser = require('cookie-parser'); //Parse Cookie header and populate req.cookies with an object keyed by the cookie names.
const jwt = require('jsonwebtoken')

/* Models*/
let User = require('./models/User.model')

let app = express()

app.set('views', path.join(__dirname, 'frontend','views'))
app.set('view engine', 'pug') 
app.use('/livedemo/chatapp', favicon(path.join(__dirname, 'public', 'favicon.ico'))) 
app.use(logger('dev')) 
app.use('/livedemo/chatapp', express.static(path.join(__dirname, 'public')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser()) //Parse Cookie header and populate req.cookies with an object keyed by the cookie names.


/* Register router */
let router = express.Router();

/* GET home page. */
router.get('/livedemo/chatapp/', function(request, response) {
  response.render('register');
})

router.get('/livedemo/chatapp/login', function (request, response) {
  response.render('login')
})

router.get('/livedemo/chatapp/app', authorize, function (request, response) {
  response.render('application')
})

function authorize (request, response, next) {
  try {
    const token = request.cookies['Authorization']
    var decoded = jwt.verify(token, process.env.JWT_SECRET);
    request['decodedJWT'] = decoded
    next ()
  } catch(err) {
    next(new Error('Missing or invalid Authorization token'))
  }
}



/* Registration, Login, Logout */
router.post('/livedemo/chatapp/auth/register', function (request, response) {
  let user = new User({
    image: request.body.image,
    username: request.body.username,
    password: request.body.password
  })

  user.save()
  .then(function (user) {
    console.log('### '+user.username+' registered successfully!')
    response.status(200).send()
  })
  .catch(function (error) {
   response.status(400).send({error: error})
  })

})

router.post('/livedemo/chatapp/auth/login', function (request, response) {
  User.findOne({username: request.body.username}).select('+password').exec()
  .then(function (user) {
    if(user.password == request.body.password) {
      user.password = null
      const token = jwt.sign({
        exp: Math.floor(Date.now() / 1000) + (60 * 60),
        data: user
      }, process.env.JWT_SECRET)

      response.status(200).cookie("Authorization", token).send({user: user, jwt: token})
    }
    response.status(400).send({error: 'Wrong password'})
  })
  .catch(function (error) {
    console.log(error)
    response.status(400).send({error: 'An error occured, please try again.'})
  })
})

router.post('/livedemo/chatapp/auth/logout', function (request, response) {
  response.clearCookie('Authorization').status(200).send({message: "Successfully logged out"})
})

app.use(router)


app.use(function(request, response) {
  const err = new Error("Not found")
  response.status(404).render('error', {error: err})
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
  console.error(error.stack)
  next(error)
})

/* MongoDB Errors */
app.use(function (error, request, response, next) {
  if(error.name === 'MongoError') {
    console.log('MongoDB Error middleware: There was a MongoDB Error!')
  }
  next(error)
})


/* Final - Catch All */
app.use(function (error, request, response, next) {
  if (response.headersSent) { //Have not understood yet, but is for the sake of express default error handing middleware
    return next(error)
  }
  response.status(error.status || 500)
  response.render('error', {error: error})
})


module.exports = app;






