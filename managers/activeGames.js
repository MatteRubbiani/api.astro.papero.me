const gameConfig = require("../constants/gameConfig")
const ActiveUsersManager = require("./activeUsers")
const GameModel = require("../models/Game")

class ActiveGamePlayers{
    constructor(playerDict) {
        this.id = playerDict.id
        this.online = playerDict.online
        this.color = playerDict.color
        this.points = playerDict.points
    }

    toJson(){
        return {
            online : this.online,
            color : this.color,
            points : this.points
        }
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
                this.players.forEach(p => { players.push(p) })
                let g = {
                    players: players,
                    admin: this.getPlayerById(this.adminUserId).color,
                    currentPlayer: this.getPlayerById(userId) ? this.getPlayerById(userId).color : null,
                    settings: settings
                }
                return g
        }
    }

    getPlayerById(userId){
        for (let i=0; i<this.players.length; i++){
            let p = this.players[i]
            if (p.userId === userId) return p
        }
        return null
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
                    online: true,
                    color: 0,
                    points: 0
                }
            ]
        }
        let g = await ActiveGames(dict)
        return g
    }
}

module.exports = ActiveGames