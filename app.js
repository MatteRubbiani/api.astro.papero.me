const express = require('express');
const cookie = require("cookie")

const Endpoints = require("./constants/endpoints")
const ActiveUsersManager = require("./managers/activeUsers")
const ActiveGames = require("./managers/activeGames")

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use("/games", require("./routes/game"))

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
    socket.join(gameId)
    let user = new ActiveUsersManager(userId, gameId, socket.id)
    await user.saveToDb()
    let game = await ActiveGames.getActiveGameById(gameId)
    if (!game) {
      game = await ActiveGames.createActiveGame(user, gameId)
      await game.saveToDb()
    }
    socket.emit(Endpoints.STATUS, game.status)
    switch (game.status){
      case 0:
        socket.emit(Endpoints.LOBBY_MODIFIED, game.getGame(userId))

      case 1:
        socket.emit(Endpoints.GAME_MODIFIED, game.getGame(userId))
    }
  })

  socket.on(Endpoints.JOIN_GAME, async () => {
    let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
    if (!user) return null
    let game = await ActiveGames.getActiveGameById(user.gameId)
    if (!game || game.status !==0) return null
    game.addPlayer(user)
    sendLobbyChangedToPlayers(game)
    await game.saveToDb()
  })

  socket.on(Endpoints.LOBBY_MODIFIED, async () => {
    let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
    if (!user) return null
    let game = await ActiveGames.getActiveGameById(user.gameId)
    if (!game || game.status !==0) return null
    socket.emit(Endpoints.LOBBY_MODIFIED, game.getGame(user.userId))
  })

  socket.on(Endpoints.CHANGE_COLOR, async data =>{
    let color = parseInt(data)
    console.log("changing color: ", color)
    let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
    if (!user) return null
    let game = await ActiveGames.getActiveGameById(user.gameId)
    if (!game) return null
    game.changePlayerColor(user.userId, color)
    console.log("color changed")
    sendLobbyChangedToPlayers(game)
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
    sendLobbyChangedToPlayers(game)
    await game.saveToDb()
  })

  socket.on(Endpoints.SET_RELOADING_VELOCITY, async data => {
    let setting = parseInt(data)
    let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
    if (!user) return null
    let game = await ActiveGames.getActiveGameById(user.gameId)
    if (!game) return null
    if (user.userId !== game.adminUserId) return null
    game.reloadingVelocity = setting
    sendLobbyChangedToPlayers(game)
    await game.saveToDb()
  })

  socket.on(Endpoints.SET_VELOCITY, async data => {
    let setting = parseInt(data)
    let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
    if (!user) return null
    let game = await ActiveGames.getActiveGameById(user.gameId)
    if (!game) return null
    if (user.userId !== game.adminUserId) return null
    game.velocity = setting
    sendLobbyChangedToPlayers(game)
    await game.saveToDb()
  })

  socket.on(Endpoints.SET_TOTAL_TURNS, async data => {
    let setting = parseInt(data)
    let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
    if (!user) return null
    let game = await ActiveGames.getActiveGameById(user.gameId)
    if (!game) return null
    if (user.userId !== game.adminUserId) return null
    game.totalTurns = setting
    sendLobbyChangedToPlayers(game)
    await game.saveToDb()
  })

  socket.on(Endpoints.SET_BULLET_VELOCITY, async data => {
    let setting = parseInt(data)
    let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
    if (!user) return null
    let game = await ActiveGames.getActiveGameById(user.gameId)
    if (!game) return null
    if (user.userId !== game.adminUserId) return null
    game.bulletVelocity = setting
    sendLobbyChangedToPlayers(game)
    await game.saveToDb()
  })

  socket.on(Endpoints.START_GAME, async () => {
    let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
    if (!user) return null
    let game = await ActiveGames.getActiveGameById(user.gameId)
    if (!game) return null
    if (user.userId !== game.adminUserId) return null
    game.startGame()
    sendToPlayersInGame(game, 1, Endpoints.STATUS)
    sendGameToPlayersInGame(game, Endpoints.GAME_MODIFIED)
    await game.saveToDb()
  })

  socket.on(Endpoints.MOVE_BIG, async data => {
    for (const [key, value] of Object.entries(socket.rooms)) {
      socket.volatile.broadcast.to(socket.rooms[value]).emit(Endpoints.MOVE_BIG, data);
    }
  })

  socket.on(Endpoints.MOVE_LITTLE, async data => {
    for (const [key, value] of Object.entries(socket.rooms)) {
      socket.volatile.broadcast.to(socket.rooms[value]).emit(Endpoints.MOVE_LITTLE, data);
    }
  })

  socket.on(Endpoints.SHOOT, async data => {
    for (const [key, value] of Object.entries(socket.rooms)) {
      socket.broadcast.to(socket.rooms[value]).emit(Endpoints.SHOOT, data);
    }
  })

  socket.on(Endpoints.CHANGE_STATE, async data => {
    for (const [key, value] of Object.entries(socket.rooms)) {
      socket.broadcast.to(socket.rooms[value]).emit(Endpoints.CHANGE_STATE, data);
    }
  })


  socket.on(Endpoints.RELOAD, async data => {
    for (const [key, value] of Object.entries(socket.rooms)) {
      socket.volatile.broadcast.to(socket.rooms[value]).emit(Endpoints.RELOAD, data);
    }
  })

  socket.on("disconnect", async () => {
    let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
    if (!user) return null
    let game = await ActiveGames.getActiveGameById(user.gameId)
    if (!game) return null
    if (game.status === 0){
      let success = game.removePlayer(user.userId)
      if (success === "game_deleted"){
        await game.deleteGame()
      }
      if (success === "user_deleted"){
        game.saveToDb()
      }
      sendLobbyChangedToPlayers(game)
    }
  })
})

function sendToPlayersInGame(game, data, endpoint, exclude=null){
  let gameUsers = game.players
  for (let i = 0; i < gameUsers.length; i++) {
    let player = gameUsers[i]
    if (player.id !== exclude){
      let s = io.sockets.connected[player.sessionId]
      if (s) {
        s.emit(endpoint, data)
      }
    }
  }
}

function sendGameToPlayersInGame(game, endpoint, exclude=null) {
  let gameUsers = game.players
  for (let i = 0; i < gameUsers.length; i++) {
    let player = gameUsers[i]
    if (player.id !== exclude) {
      let s = io.sockets.connected[player.sessionId]
      if (s) {
        s.emit(endpoint, game.getGame(player.id))
      }
    }
  }
}

function sendLobbyChangedToPlayers(game){
  let gameUsers = game.players
  for (let i=0; i<gameUsers.length; i++){
    let player = gameUsers[i]
    let s = io.sockets.connected[player.sessionId]
    if (s) {
      s.emit(Endpoints.LOBBY_MODIFIED, game.getGame(player.id))
    }
  }
}





http.listen(3003)
