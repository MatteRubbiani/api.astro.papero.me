const mongoose = require("mongoose")
require("dotenv").config()

mongoose.connect(process.env.MONGO_DB_URL, { useNewUrlParser: true, useUnifiedTopology: true})
const GameSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    adminUserId: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        required: true
    },
    totalTurns: {
        type: Number,
    },
    velocity: {
        type: Number,
    },
    angularVelocity: {
        type: Number,
    },
    reloadingVelocity: {
        type: Number,
    },
    bulletVelocity: {
        type: Number
    },
    players: {
        type: Array,
        default:[]
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
})

module.exports = mongoose.model("Games", GameSchema)