var express = require("express");
var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var mysql = require('mysql');

var con = mysql.createConnection({
  host: "172.22.1.67",
  user: "root",
  password: "1234",
  database: 'node_clients',
  port: 32768
});

con.connect(function(err) {
  if (err) throw err;
  console.log("DB Connected!");
});

var PORT = process.env.PORT || 7000;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

var users = [];
var body, text, user;


io.sockets.on("connection", (socket) => {
  //socket.username = username;
  console.log("Client " + socket.id + " connected.");
  senduserlist();

  socket.on("Client_Send_Username", (data) => {
    if (socket.id) {
      if (users.indexOf(socket.id) > -1) {
        //socket.emit("svr_msg", "'" + socket.id + "' is taken! Try some other username.");
        socket.emit("svr_msg", "'" + socket.id + "' You already joined this room.");
      } else {
        //let newuser = [data,socket.id];
        users.push(socket.id);

        var query = con.query(
          "INSERT INTO user set socketid = ?, username = ?", [socket.id, socket.id],
          (error, results) => {
            if (error) throw error;
            console.log("1 record inserted");
        });
        socket.emit("Joined", {
          username: data
        });
        senduserlist();
        console.log("Joined : " + socket.id);
      }

    } else {
      socket.emit("svr_msg", "Empty username is NOT allowed!");
    }
  });

  socket.on("disconnect", () => {
    console.log("disconnect : " + socket.id);
    const disconnectUserPos = users.findIndex(users => users === socket.id);
    users.splice(disconnectUserPos);
    senduserlist();
  });

  socket.on("message", (message) => {
    io.sockets.emit("newmsg", {
      user: socket.id,
      body: message.body
    });
    console.log(socket.id + ": " + message.body);
  });
});
senduserlist = () => {
  io.emit("userlist", (users));
  console.log(users);
  console.log("listsent");
}
http.listen(PORT, () => {
  console.log("listening on port:" + PORT);
});
