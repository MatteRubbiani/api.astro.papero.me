const express = require('express');
const cookie = require("cookie")

const Endpoints = require("./constants/endpoints")
const ActiveUsersManager = require("./managers/activeUsers")
const ActiveGames = require("./managers/activeGames")

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use("/games", require("./routes/game"))

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

    socket.on(Endpoints.CHANGE_COLOR, async data =>{
      let color = parseInt(data)
      let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
      if (!user) return null
      let game = await ActiveGames.getActiveGameById(user.gameId)
      if (!game) return null
      let success = game.changePlayerColor(user.userId, color)
      if (!success) return null
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

    io.to(socket.rooms).emit(Endpoints.MOVE_BIG, data);
    //socket.broadcast.emit(Endpoints.MOVE_BIG, data)
    /*
    let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
    if (!user) return null
    let game = await ActiveGames.getActiveGameById(user.gameId)
    if (!game) return null
    //sendToPlayersInGame(game, data, Endpoints.MOVE_BIG, user.userId)*/
  })

  socket.on(Endpoints.MOVE_LITTLE, async data => {
    console.log(socket.rooms)
    io.to(socket.rooms).emit(Endpoints.MOVE_LITTLE, data);
    //socket.broadcast.emit(Endpoints.MOVE_LITTLE, data)
    /*let user = await ActiveUsersManager.findActiveUserBySessionId(socket.id)
    if (!user) return null
    let game = await ActiveGames.getActiveGameById(user.gameId)
    if (!game) return null
    //sendToPlayersInGame(game, data, Endpoints.MOVE_BIG, user.userId)*/
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
