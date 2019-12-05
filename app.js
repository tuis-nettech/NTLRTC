//const express = require('express');
//const app = require('express')();
const http = require('http'); //.createServer(app);
const socketio = require('socket.io')(http);
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
var fs = require('fs');
var path = require('path');
var mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.jpg': 'image/jpg',
};

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

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      //エラー時の応答
    } else {
      res.end(data, 'UTF-8');
    }
  });
}).listen(PORT);


var names = [];
var records = [names];

var body, text, user;

var io = socketio.listen(http_server);

io.sockets.on('connection', (socket) => {
  console.log('connected  :' + socket.id);
  senduserlist();

  socket.on('Client_Send_Username', (data) => {
    if (data) {
      if (names.indexOf(data) > -1) {
        socket.emit('svr_msg', data + ' is taken! Try some other username.');
        //socket.emit('svr_msg',  data + ', You already joined this room.');
      } else {

        //let newuser = [data,socket.id];
        records.push([socket.id, data]);
        console.log('amountofuser=' + names.length);

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

    } else {
      socket.emit('svr_msg', 'Empty username is NOT allowed!');
    }
  });

  socket.on('disconnect', () => {
    console.log('disconnect :' + socket.id);
    const disconnectUserPos = names.findIndex(names => names === socket.id);
    names.splice(disconnectUserPos);
    senduserlist();
  });

  socket.on('message', (message) => {
    var msg = message.body;
    var cleanmsg;
    io.sockets.emit('newmsg', {
      user: socket.id,
      body: msg
    });
    console.log('said :' + socket.id + ': ' + message.body);
  });
});
senduserlist = () => {
  io.emit('userlist', (names));
  console.log(names[1]);
  console.log('listsent');
};
