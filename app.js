const express = require('express');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

let lastId = 0;
io.on('connection', socket => {

  socket.on("move", data => {
    socket.broadcast.emit("move", data)
  })

  socket.on("new-player", () => {
    console.log("new player: ", lastId)
    lastId = lastId + 1
    socket.emit("new-player", lastId)
    socket.broadcast.emit("new-player", lastId)

  })

  socket.on("get-game", () => {
    console.log("getting game: ", lastId)
    socket.emit("get-game", lastId)
  })
})

http.listen(3003)
