Endpoints = {
    CONNECT_TO_GAME: "connect-to-game", // -> status a me + lobby modified se status 0
    STATUS: "status", //number
    JOIN_GAME: "join-game",
    LOBBY_MODIFIED: "lobby-modified", //{players: [], currentPlayer: 0, totalTurns: 5, admin: 0}
    CHANGE_COLOR: "change-color", //number -> lobbyModified a tutti
    SET_TOTAL_TURNS: "set-total-turns", //number -> lobbyModified a tutti
    SET_VELOCITY: "set-velocity", //number -> lobbyModified a tutti
    SET_ANGULAR_VELOCITY: "set-angular-velocity", //number -> lobbyModified a tutti
    SET_RELOADING_VELOCITY: "set-reloading-velocity", //number -> lobbyModified a tutti
    SET_BULLET_VELOCITY: "set-bullet-velocity", //number -> lobbyModified a tutti
    START_GAME: "start-game",
    MOVE_BIG: "update-ship",
    GAME_MODIFIED: "game-modified",
    SHOOT: "shoot",
    CHANGE_STATE: "change-state",
    RELOAD: "reload",
    READY: "ready",
    END_TURN: "end-turn",
    START_TURN: "start-turn",
    READY_TURN: "ready-turn"
}

module.exports = Endpoints