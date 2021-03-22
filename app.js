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
    try {
      cookies = cookie.parse(cookies)
    }catch (e){
      console.log(e)
      return null
    }
    let userId = cookies["userId"]
    let gameId = data["gameId"].toLowerCase()
    if (!userId || !gameId) return null
    let user = new ActiveUsersManager(userId, gameId, socket.id)
    await user.saveToDb()
    let game = await ActiveGames.getActiveGameById(gameId)
    if (!game) {
      game = await ActiveGames.createActiveGame(userId, gameId)
      await game.saveToDb()
    }
    socket.emit(Endpoints.STATUS, game.status)
    switch (game.status){
      case 0:
        socket.emit(Endpoints.LOBBY_MODIFIED, game.getGame(userId))
    }
  })

  socket.on(Endpoints.JOIN_GAME, async () => {
    let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
    if (!user) return null
    let game = await ActiveGames.getActiveGameById(user.gameId)
    if (!game) return null
    game.addPlayer(user.userId)
    await sendLobbyChangedToPlayers(game)
    await game.saveToDb()
  })

    socket.on(Endpoints.CHANGE_COLOR, async data =>{
      console.log("changing color")
      console.log(data)
      let color = parseInt(data)
      let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
      if (!user) return null
      let game = await ActiveGames.getActiveGameById(user.gameId)
      if (!game) return null
      let success = game.changePlayerColor(user.userId, color)
      console.log(success)

      await sendLobbyChangedToPlayers(game)
      await game.saveToDb()
    })

  socket.on(Endpoints.SET_ANGULAR_VELOCITY, async data => {
    let setting = parseInt(data)
    let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
    if (!user) return null
    let game = await ActiveGames.getActiveGameById(user.gameId)
    if (!game) return null
    if (user.userId !== game.adminUserId) return null
    game.angularVelocity = setting
    await sendLobbyChangedToPlayers(game)
    await game.savetoDb()
  })

  socket.on(Endpoints.SET_RELOADING_VELOCITY, async data => {
    let setting = parseInt(data)
    let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
    if (!user) return null
    let game = await ActiveGames.getActiveGameById(user.gameId)
    if (!game) return null
    if (user.userId !== game.adminUserId) return null
    game.reloadingVelocity = setting
    await sendLobbyChangedToPlayers(game)
    await game.savetoDb()
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

async function sendLobbyChangedToPlayers(game){
  let gameUsers = await ActiveUsersManager.getUsersByGameId(game.id)
  for (let i=0; i<gameUsers.length; i++){
    let player = gameUsers[i]
    let s = io.sockets.connected[player.sessionId]
    if (s) {
      s.emit(Endpoints.LOBBY_MODIFIED, game.getGame(player.userId))
    }
  }
}



http.listen(3003)
