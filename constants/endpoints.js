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
    START_GAME: "start-game",
}

module.exports = Endpoints