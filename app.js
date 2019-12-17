const express = require('express');
const app = express();

var createError = require('http-errors');
var path = require('path');
//var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const http = require('http'); //.createServer(app);
const socketio = require('socket.io')(http);
const mysql = require('mysql2');
//const bcrypt = require('bcrypt');
const session = require('express-session');
var fs = require('fs');
var mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.jpg': 'image/jpg',
};


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

var con = mysql.createConnection({
  host: '172.22.1.67',
  user: 'root',
  password: '1234',
  database: 'node_clients',
  port: 32768
});

con.connect(function(err) {
  if (err) throw err;
  console.log('DB Connected!');
});

var query = con.query('DELETE FROM user;',
  (error, results) => {
    if (error) throw error;
    console.log('DB Refreshed.');
  });

var PORT = process.env.PORT || 7000;

app.use(function (req, res, next) {
  console.log('Time:', Date.now());
  next();
});

var http_server = new http.createServer((req, res) => {
  if (req.url == '/') {
    filePath = '/index.html';
  } else {
    filePath = req.url;
  }
  console.log('req ' + req.url);
  var fullPath = __dirname + filePath;
  //console.log(__dirname + filePath);
  res.writeHead(200, {
    'Content-Type': mime[path.extname(fullPath)] || 'text/plain'
  });
  //console.log();

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      //console.log('Read err : '+ err);
    } else {
      res.end(data, 'UTF-8');
    }
  });

  //console.log('listening on port:' + PORT);
}).listen(PORT);

app.use(function (req, res, next) {
  console.log('Time:', Date.now());
  next();
});

app.use(session({
  secret: 'schokahoge',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxage: 1000 * 60 * 30
  }
}));

var names = [];
var ids = [];

var io = socketio.listen(http_server);

var senduserlist = () => {
  io.emit('userlist', (names));
  //console.log(names);
  //console.log(ids);
  //console.log('listsent');
};

var counter = 0;

/*var sessionCheck = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};*/

io.sockets.on('connection', (socket) => {
  console.log('connected  :' + socket.id);
  senduserlist();
  io.emit('svr_msg', '');

	//sessionCheck();

  socket.on('Client_Send_Username', (name, passkey) => {
    if (name, passkey) {
      if (ids.indexOf(socket.id) > -1) {
        socket.emit('svr_msg', 'You seems had already submitted your name!');
      } else {
        if (names.indexOf(name) > -1) {
          socket.emit('svr_msg', name + ' is taken! Try some other username.');
          //socket.emit('svr_msg',  data + ', You already joined this room.');
        } else {
          //let newuser = [data,socket.id];
          names.push(name);
          counter++;
          ids.push(socket.id);
          console.log('amountofuser=' + names.length);
          console.log('names=' + names);
          //console.log('records='+records);
          var query = con.query('REPLACE INTO user (ids, name, hash) VALUES(?, ?, ?) ', [counter, name, passkey],
            (error, results) => {
              if (error) throw error;
              console.log('1 record inserted');
            });
          socket.emit('Joined', {
            username: name
          });
          senduserlist();
          console.log('Joined : ' + socket.id);
        }
      }
    } else {
      socket.emit('svr_msg', 'Empty username is NOT allowed!');
    }
  });

  socket.on('disconnect', () => {
    console.log('disconnect :' + socket.id);
    const disconnectUserPos = names.findIndex(names => names === socket.id);
    names.splice(disconnectUserPos);
    ids.splice(disconnectUserPos);
    senduserlist();
  });

  socket.on('message', (message) => {

    var msg = message.body;
    var name = names[ids.indexOf(socket.id)];
    if (name == undefined) {
      name = 'annony';
    }
    io.sockets.emit('newmsg', {
      user: name,
      body: msg
    });
    console.log('said :' + name + ': ' + msg);
  });
});
