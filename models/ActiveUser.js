const mongoose = require("mongoose")
require("dotenv").config()
mongoose.connect(process.env.MONGO_DB_URL, { useNewUrlParser: true, useUnifiedTopology: true})
const ActiveUserSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    gameId: {
        type: String,
        required: true
    },
    sessionId: {
        type: String
    }
})

module.exports = mongoose.model("ActiveUser", ActiveUserSchema)