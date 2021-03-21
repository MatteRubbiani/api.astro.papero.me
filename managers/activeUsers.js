const ActiveUserModel = require("../models/ActiveUser")

class ActiveUsersManager{
    constructor(userId, gameId, sessionId) {
        this.userId = userId
        this.gameId = gameId
        this.sessionId = sessionId
    }

    async saveToDb(){
        let data = {
            userId : this.userId,
            gameId : this.gameId,
            sessionId : this.sessionId,
        }
        await ActiveUserModel.replaceOne({userId: this.userId}, data, {upsert: true})
    }

    async removeFromDb(){
        await ActiveUserModel.remove({userID: this.userId})
    }

    static async findActiveUserById(userId){
        let activeUser = await ActiveUserModel.findOne({userId: userId}).exec()
        if (!activeUser) return null
        return ActiveUsersManager.convertModelToObj(activeUser)
    }

    static async findActiveUserBySessionId(sessionId){
        let activeUser = await ActiveUserModel.findOne({sessionId: sessionId}).exec()
        if (!activeUser) return null
        return ActiveUsersManager.convertModelToObj(activeUser)
    }

    static async getUsersByGameId(gameId){
        let activeUsers = await ActiveUserModel.find({gameId: gameId}).exec()
        let p = []
        activeUsers.forEach(user => {
            p.push(ActiveUsersManager.convertModelToObj(user))
        })
        return p
    }

    static convertModelToObj(model){
        return new ActiveUsersManager(model.userId, model.gameId, model.sessionId)
    }


}

module.exports = ActiveUsersManager