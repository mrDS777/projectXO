ActionsInvites = function () {
    var self = this;

    /**
     * Создадим игру, вернём её каллбэком.
     * @param fieldTypeId {Number} id типа поля, LogixXO.FIELD_TYPE_*.
     * @param creatorSignId {Number} id знака запрашиваемого создателем, LogicXO.SIGN_ID_*.
     * @param creatorUserId {Number} внутрений id пользователя создающего игру.
     * @param joinerUserId {Number} внутрений id второго участника игры.
     */
    this.createGame = function (fieldTypeId, creatorSignId, creatorUserId, joinerUserId, callback) {
        var game, joinerSignId;
        Logs.log("ActionsInvites.createGame", Logs.LEVEL_DETAIL, arguments);
        game = LogicXO.create(creatorUserId, creatorSignId, fieldTypeId, false, true, false);
        /* @todo учесть знака второго игрока, пока что любой  */
        joinerSignId = LogicXO.SIGN_ID_Empty;
        game = LogicXO.joinGame(joinerUserId, joinerSignId, game);
        game = LogicXO.chooseSigns(game);
        game = LogicXO.run(game);
        DataGame.save(game, function (game) {
            LogicGameStore.save(game);
            callback(game);
        });
    };

    /**
     * Сделать ход в игре.
     * @param userId {Number} id игрока.
     * @param gameId {Number} id игры.
     * @param x {Number}
     * @param y {Number}
     * @param checkWinner {Boolean}
     * @param callback {Function}
     */
    this.doMove = function (userId, gameId, x, y, checkWinner, callback) {
        var game, user, winLine, oldStatus;
        game = LogicGameStore.load(gameId);
        if (!game) {
            Logs.log("ActionsInvites.doMove. game not found", Logs.LEVEL_WARNING, arguments);
            return;
        }
        if (!LogicXO.userCanDoMove(game, userId, x, y)) {
            Logs.log("ActionsInvites.doMove. current user can't go right now", Logs.LEVEL_DETAIL);
            return;
        }
        if (!game.isInvitation) {
            Logs.log("ActionsInvites.doMove. User cannot do move, because is not invitation.", Logs.LEVEL_WARNING, {
                game: game,
                userId: userId
            });
            return;
        }
        oldStatus = game.status;
        game = LogicXO.setSign(game, x, y);
        game = LogicXO.switchTurn(game);
        game.lastMove = {x: x, y: y};
        if (checkWinner) {
            winLine = LogicXO.findWinLine(game);
            game = LogicXO.setOutcomeResults(game, winLine);
        }
        LogicGameStore.save(game);
        callback(game, oldStatus);
    };
};

/**
 * Константный класс.
 * @type {ActionsInvites}
 */
ActionsInvites = new ActionsInvites();