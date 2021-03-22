const gameConfig = require("../constants/gameConfig")
const ActiveUsersManager = require("./activeUsers")
const GameModel = require("../models/Game")

class ActiveGamePlayers{
    constructor(playerDict) {
        this.id = playerDict.id
        this.online = playerDict.online
        this.color = playerDict.color
        this.points = playerDict.points
        this.localId = playerDict.localId
    }
}

class ActiveGames{
    constructor(gameDict) {
        this.id = gameDict.id
        this.adminUserId = gameDict.adminUserId
        this.status = gameDict.status
        this.totalTurns = gameDict.totalTurns
        this.velocity = gameDict.velocity
        this.angularVelocity = gameDict.angularVelocity
        this.reloadingVelocity = gameDict.reloadingVelocity
        this.createdAt = gameDict.createdAt
        this.players = []
        for (let i=0; i<gameDict.players.length; i++){
            let p = new ActiveGamePlayers(gameDict.players[i])
            this.players.push(p)
        }
    }

    getGame(userId){
        switch (this.status){
            case 0:
                let settings = {
                    totalTurns: this.totalTurns,
                    velocity: this.velocity,
                    angularVelocity: this.angularVelocity,
                    reloadingVelocity: this.reloadingVelocity
                }
                let players = []
                this.players.forEach(p => { players.push(
                    {
                        online : p.online,
                        color : p.color,
                        points : p.points,
                        localId : p.localId
                    }
                    )
                })
                let g = {
                    players: players,
                    admin: this.getPlayerById(this.adminUserId).localId,
                    currentPlayer: this.getPlayerById(userId) ? this.getPlayerById(userId).localId : null,
                    settings: settings
                }
                return g
        }
    }

    getPlayerById(userId){
        for (let i=0; i<this.players.length; i++){
            let p = this.players[i]
            if (p.id === userId) return p
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

    addPlayer(userId){
        if (this.getPlayerById(userId)) return null
        let p = {
            id: userId,
            localId: Date.now(),
            online: true,
            color: this.getFirstAvailableColor(),
            points: 0
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

    changeSettings

    async saveToDb(){
        let d = {
            id: this.id,
            adminUserId: this.adminUserId,
            status: this.status,
            totalTurns: this.totalTurns,
            velocity: this.velocity,
            angularVelocity: this.angularVelocity,
            reloadingVelocity: this.reloadingVelocity,
            createdAt: this.createdAt,
            players: this.players
        }
        await GameModel.replaceOne({id: this.id}, d, {upsert: true})
    }

    static async getActiveGameById(gameId) {
        let game = await GameModel.findOne({id: gameId}, (err, game) => {
            return game
        }).exec()
        if (!game) return null
        let g = await new ActiveGames(game);
        return g
    }

    static async createActiveGame(userId, gameId){
        const dict = {
            id : gameId,
            status : 0,
            numberOfTurns: gameConfig.defaultTurns,
            adminUserId: userId,
            totalTurns: gameConfig.totalTurns,
            velocity: gameConfig.velocity,
            angularVelocity: gameConfig.angularVelocity,
            reloadingVelocity: gameConfig.reloadingVelocity,
            players: [
                {
                    id: userId,
                    localId: 0,
                    online: true,
                    color: 0,
                    points: 0
                }
            ]
        }
        let g = await new ActiveGames(dict)
        return g
    }
}

module.exports = ActiveGames