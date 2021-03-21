const express = require('express');
const cookie = require("cookie")

const Endpoints = require("./constants/endpoints")
const ActiveUsersManager = require("./managers/activeUsers")
const ActiveGames = require("./managers/activeGames")

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

let lastId = 0;
io.on('connection', socket => {
  socket.on(Endpoints.CONNECT_TO_GAME, async data => {
    let cookies = socket.handshake.headers.cookie
    cookies = cookie.parse(cookies)
    let userId = cookies["userId"]
    let gameId = data["gameId"].toLowerCase()
    if (!userId || !gameId) return null
    let user = new ActiveUsersManager(userId, gameId, socket.id)
    await user.saveToDb()
    let game = await ActiveGames.getActiveGameById(gameId)
    if (!game) game = await ActiveGames.createActiveGame(userId, gameId)
    socket.emit(Endpoints.STATUS, game.status)
    switch (game.status){
      case 0:
        socket.emit(Endpoints.LOBBY_MODIFIED, game.getGame())
    }
  })

  socket.on("move", data => {
    socket.broadcast.emit("move", data)
  })

  socket.on("shoot", data => {
    socket.broadcast.emit("shoot", data)
  })

  socket.on("new-player", () => {
    console.log("new player: ", lastId)
    lastId = lastId + 1
    socket.emit("your-id", lastId - 1)
    socket.broadcast.emit("new-player", lastId - 1)

  })

  socket.on("get-game", () => {
    console.log("getting game: ", lastId)
    socket.emit("get-game", lastId)
  })
})

http.listen(3003)
