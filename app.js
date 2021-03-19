const express = require('express');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

io.on('connection', socket => {
  console.log("connecteeed")
  socket.on("move", data => {
    socket.broadcast.emit("move", data)
  })
})

http.listen(3003)
console.log("running")
