const express = require('express');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

let lastId = null;
io.on('connection', socket => {
  console.log("connecteeed")
  socket.on("move", data => {
    socket.broadcast.emit("move", data)
  })

  socket.on("new-player", () => {
    console.log("new player ")
    console.log(lastId)
    socket.emit("new-player", lastId ? lastId + 1 : 0);
    lastId = lastId ? lastId + 1 : 0;
  })

  socket.on("get-game", () => {
    console.log("getting game")
    socket.emit("get-game", lastId ? lastId + 1 : 0);
    socket.broadcast.emit("get-game", lastId ? lastId + 1 : 0)
  })
})

http.listen(3003)
console.log("running")
