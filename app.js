//const express = require('express');
//const app     = require('express')();
const config   = require('config');
const http     = require('http'); //.createServer(app);
const socketio = require('socket.io')(http);
const mysql    = require('mysql2');
const bcrypt   = require('bcrypt');
///////////////////////////////////////////////
var fs = require('fs');
var path = require('path');
var mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.jpg': 'image/jpg',
};
///////////////////////////////////////////////
var con = mysql.createConnection({
  host:     config.mysql.hostname,
  user:     config.mysql.username,
  password: config.mysql.password,
  database: config.mysql.database,
  port:     config.mysql.port
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
///////////////////////////////////////////////
var PORT = process.env.PORT || config.web.port;

/*app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

http.listen(PORT, () => {
  console.log('listening on port:' + PORT);
});*/


var http_server = new http.createServer((req, res) => {
  if (req.url == '/') {
    filePath = '/index.html';
    console.log('req /index.html');
  } else {
    filePath = req.url;
    console.log('req ' + req.url);
  }
  //ここで絶対PATHの取得
  var fullPath = __dirname + filePath;
  console.log(__dirname + filePath);
  res.writeHead(200, {
    'Content-Type': mime[path.extname(fullPath)] || 'text/plain'
  });
  console.log();

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      //エラー時の応答
      console.log("Read err : "+ err);
    } else {
      res.end(data, 'UTF-8');
    }
  });
}).listen(PORT);

var names = [];
var ids = [];

var body, text, user;

var io = socketio.listen(http_server);

senduserlist = () => {
  io.emit('userlist', (names));
  console.log(names);
  console.log(ids);
  console.log('listsent');
};

io.sockets.on('connection', (socket) => {
  console.log('connected  :' + socket.id);
  senduserlist();
  io.emit('svr_msg', '');

  socket.on('Client_Send_Username', (data) => {
    if (data) {
      if (ids.indexOf(socket.id) > -1) {
        socket.emit('svr_msg', 'You seems had already submitted your name!');
      } else {
        if (names.indexOf(data) > -1) {
          socket.emit('svr_msg', data + ' is taken! Try some other username.');
            //socket.emit('svr_msg',  data + ', You already joined this room.');
          } else {
          //let newuser = [data,socket.id];
          names.push(data);
          ids.push(socket.id);
          console.log('amountofuser=' + names.length);
          console.log('names=' + names);
          //console.log('records='+records);
          var query = con.query('REPLACE INTO user (num, socketid, name) VALUES(?, ?, ?) ', [names.length, socket.id, data],
            (error, results) => {
              if (error) throw error;
              console.log('1 record inserted');
            });
          socket.emit('Joined', {
            username: data
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
    if (name == undefined){
      name = 'dorothy';
    }
    io.sockets.emit('newmsg', {
      user: name,
      body: msg
    });
    console.log('said :' + message.user + ': ' + message.body);
  });
});
