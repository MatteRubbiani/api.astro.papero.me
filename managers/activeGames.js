const gameConfig = require("../constants/gameConfig")
const GameModel = require("../models/Game")

class ActiveGamePlayers{
    constructor(playerDict) {
        this.id = playerDict.id
        this.sessionId = playerDict.sessionId
        this.status = playerDict.status
        this.color = playerDict.color
        this.points = playerDict.points
        this.localId = playerDict.localId
        this.from = playerDict.from
        this.to = playerDict.to
    }
}

class ActiveGames{
    static readyPlayers = []
    static readyPlayersForTurn = {}
    static gamesStatus = {}
    constructor(gameDict) {
        this.id = gameDict.id
        this.adminUserId = gameDict.adminUserId
        this.status = gameDict.status
        this.totalTurns = gameDict.totalTurns
        this.velocity = gameDict.velocity
        this.angularVelocity = gameDict.angularVelocity
        this.reloadingVelocity = gameDict.reloadingVelocity
        this.bulletVelocity = gameDict.bulletVelocity
        this.createdAt = gameDict.createdAt
        this.players = []
        for (let i=0; i<gameDict.players.length; i++){
            let p = new ActiveGamePlayers(gameDict.players[i])
            this.players.push(p)
        }
        this.timer = gameDict.timer
    }

    getGame(userId) {
        let players
        let g
        let settings = {
            pointsToWin: this.totalTurns, //occhio è pointstowinn
            velocity: this.velocity,
            angularVelocity: this.angularVelocity,
            reloadingVelocity: this.reloadingVelocity,
            bulletVelocity: this.bulletVelocity
        }
        players = []
        this.players.forEach(p => {
            players.push(
                {
                    state: p.status, //occhio è stateeee
                    color: p.color,
                    points: p.points,
                    localId: p.localId,
                    from: p.from,
                    to: p.to,
                }
            )
        })
        g = {
            status: this.status,
            players: players,
            admin: this.getPlayerById(this.adminUserId).localId,
            currentPlayer: this.getPlayerById(userId) ? this.getPlayerById(userId).localId : null,
            settings: settings,
            timer: this.timer
        }
        return g

    }

    getPlayerById(userId){
        for (let i=0; i<this.players.length; i++){
            let p = this.players[i]
            if (p.id === userId) return p
        }
        return null
    }

    getPlayerByLocalId(localId){
        for (let i=0; i<this.players.length; i++){
            let p = this.players[i]
            if (p.localId === localId) return p
        }
        return null
    }

    getFirstAvailableColor(){
        for (let i=0; i<30; i++){
            let free = true
            for (let j=0; j<this.players.length; j++){
                if (this.players[j].color === i) free = false
            }
            if (free) return i
        }
    }

    addPlayer(activeUser){
        if (this.getPlayerById(activeUser.userId)) return null
        let p = {
            id: activeUser.userId,
            sessionId: activeUser.sessionId,
            localId: Date.now(),
            status: 2,
            color: this.getFirstAvailableColor(),
            points: 0,
            from: 0,
            to: 0
        }
        this.players.push(p)
    }

    changePlayerColor(userId, color){
        let busy = false
        for (let i=0; i<this.players.length; i++){
            if (this.players[i].color === color) busy = true
        }
        if (!busy) {
            for (let i=0; i<this.players.length; i++){
                let p = this.players[i]
                if (p.id === userId){
                    p.color = color
                }
            }
        }
        return busy
    }

    removePlayer(userId){
        for (let i=0; i<this.players.length; i++){
            if (this.players[i].id === userId){
                if (this.players.length < 2){
                    return "game_deleted"
                }
                if(this.players[i].id === this.adminUserId){
                    this.players.splice(i, 1)
                    this.adminUserId = this.players[0] ? this.players[0].id : this.players[1].id
                }else{
                    this.players.splice(i, 1)
                }
                return "user_deleted"
            }
        }
        return null
    }

    startGame(){
        ActiveGames.gamesStatus[this.id] += .5
        this.status += 0.5
        ActiveGames.readyPlayersForTurn[this.id] = []
    }

    addPoints(userId, points){
        for (let i=0; i<this.players.length; i++){
            if (this.players[i].id === userId){
                this.players[i].to +=  points
            }
        }
    }

    changePlayerStatus(userId, status){
        for (let i=0; i<this.players.length; i++){
            if (this.players[i].id === userId){
                if (status === 0.5) ActiveGames.readyPlayers.push(userId)
                else this.players[i].status = status
            }
        }
    }

    allPlayersReady(){
        let allReady = true
        for (let i=0; i<this.players.length; i++) {
            if (!ActiveGames.readyPlayers.includes(this.players[i].id)) allReady = false
        }
        if (allReady){
            for (let i=0; i<ActiveGames.readyPlayers.length; i++) {
                for (let j = 0; j<this.players.length; j++){
                    if (ActiveGames.readyPlayers[i] === this.players[j].id){
                         ActiveGames.readyPlayers.splice(i, 1)
                    }
                }
            }
        }
        return allReady
    }

    addKillAndCheckTurnEnded(killerUserId, killedUserId){
        console.log(this.status, ActiveGames.gamesStatus[this.id])
        if ((ActiveGames.gamesStatus[this.id] * 10 % 10) !== 0) return null
        //add points to attacker
        this.addPoints(killerUserId, 1)
        //change status
        this.changePlayerStatus(killedUserId, 0)
        let alivePlayers = 0
        for (let i=0; i<this.players.length; i++){
            if (this.players[i].status > 0) alivePlayers ++
        }
        if (alivePlayers <= 1) {
            this.endTurn()
            return true
        }
        return false
    }

    endTurn(){
        ActiveGames.gamesStatus[this.id] += .5
        this.status += .5
        this.timer = Date.now() + 10 * 1000
    }

    startTurn(){
        ActiveGames.gamesStatus[this.id] += .5
        this.status += .5
        for (let i=0; i<this.players.length; i++){
            this.players[i].status = 2
            this.players[i].from = this.players[i].to
            this.players[i].to = this.players[i].from
        }
    }

    playerReadyForTurn(userId){
        ActiveGames.readyPlayersForTurn[this.id].push(userId)
    }

    checkAllPlayersReady(){
        if (ActiveGames.readyPlayersForTurn[this.id].length >= this.players.length){
            ActiveGames.readyPlayersForTurn[this.id] = []
            return true
        }
    }

    async saveToDb(){
        let d = {
            id: this.id,
            adminUserId: this.adminUserId,
            status: this.status,
            totalTurns: this.totalTurns,
            velocity: this.velocity,
            angularVelocity: this.angularVelocity,
            reloadingVelocity: this.reloadingVelocity,
            bulletVelocity: this.bulletVelocity,
            createdAt: this.createdAt,
            players: this.players,
            timer: this.timer
        }
        await GameModel.replaceOne({id: this.id}, d, {upsert: true})
    }

    async deleteGame(){
        await GameModel.remove({id: this.id})
    }

    static async getActiveGameById(gameId) {
        let game = await GameModel.findOne({id: gameId}, (err, game) => {
            return game
        }).exec()
        if (!game) return null
        let g = await new ActiveGames(game);
        return g
    }

    static async createActiveGame(activeUser, gameId){
        const dict = {
            id : gameId,
            status : 0,
            numberOfTurns: gameConfig.defaultTurns,
            adminUserId: activeUser.userId,
            totalTurns: gameConfig.totalTurns,
            velocity: gameConfig.velocity,
            angularVelocity: gameConfig.angularVelocity,
            bulletVelocity: gameConfig.bulletVelocity,
            reloadingVelocity: gameConfig.reloadingVelocity,
            players: [
                {
                    id: activeUser.userId,
                    sessionId: activeUser.sessionId,
                    localId: 0,
                    status: 2,
                    color: 0,
                    points: 0,
                    from: 0,
                    to: 0
                }
            ]
        }
        ActiveGames.gamesStatus[this.id] = 0
        console.log(ActiveGames.gamesStatus)
        console.log("status set")
        let g = await new ActiveGames(dict)
        return g
    }
}

module.exports = ActiveGames