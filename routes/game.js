const express = require('express');
const router = express.Router();
const ActiveGamesManager = require("../managers/activeGames")

router.get("/status_by_id", async (req, res) =>{
    let gameId = req.query.game_id
    let game = await ActiveGamesManager.getActiveGameById(gameId)
    if (!game) {
        res.send(null)
        return null
    }
    res.send(true)
})

module.exports = router;
