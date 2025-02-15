/**
 * Основная страница игры.
 * @constructor
 */
PageBlockMain = function PageBlockMain() {
    var self = this;

    /**
     * Показывать ли страницу.
     * @type {boolean}
     */
    var showed = false;

    /**
     * Массив всех элементов страницы.
     * @type {Array}
     */
    this.elements = [];

    /**
     * Элемент списка друзей.
     * @type {ElementFriendsType}
     */
    this.elementFriendsType = null;

    /**
     * @type {ElementButton}
     */
    var elementFriendsTypeLeftButton;

    /**
     * @type {ElementButton}
     */
    var elementFriendsTypeRightButton;

    var friendsTypeOffset = 0;

    /**
     * Создадим тут все элементы страницы.
     */
    this.init = function () {
        var element;
        /* Кнопка играть. */
        element = GUI.createElement(ElementButton, {
            x: 259,
            y: 225,
            title: 'Играть с роботом',
            srcRest: '/images/buttons/playRest.png',
            srcHover: '/images/buttons/playHover.png',
            srcActive: '/images/buttons/playActive.png',
            onClick: LogicPageMain.onPlayButtonClick
        });
        self.elements.push(element);
        /* Выбор типа поля игры */
        element = GUI.createElement(ElementRadio, {
            options: [
                {
                    srcRest: '/images/radio/field15x15Rest.png',
                    srcHover: '/images/radio/field15x15Hover.png',
                    srcActive: '/images/radio/field15x15Active.png',
                    x: 554,
                    y: 100,
                    title: 'поле 15 на 15, \r\nпобеждает линия \r\nиз 5-ти знаков.',
                    value: LogicXO.FIELD_TYPE_15X15
                },
                {
                    srcRest: '/images/radio/field3x3Rest.png',
                    srcHover: '/images/radio/field3x3Hover.png',
                    srcActive: '/images/radio/field3x3Active.png',
                    x: 558,
                    y: 159,
                    title: 'поле 3 на 3, \r\nпобеждает линия \r\nиз 3-ёх знаков.',
                    value: LogicXO.FIELD_TYPE_3X3
                }
            ],
            currentIndex: 0,
            onChange: LogicPageMain.onRadioFieldTypeChange
        });
        self.elements.push(element);
        /* Выбор знака игры */
        element = GUI.createElement(ElementRadio, {
            options: [
                {
                    srcRest: '/images/radio/signRandomRest.png',
                    srcHover: '/images/radio/signRandomHover.png',
                    srcActive: '/images/radio/signRandomActive.png',
                    x: 97,
                    y: 90,
                    width: 148,
                    height: 70,
                    title: 'Играть любым знаком.',
                    value: LogicXO.SIGN_ID_Empty
                },
                {
                    srcRest: '/images/radio/signXRest.png',
                    srcHover: '/images/radio/signXHover.png',
                    srcActive: '/images/radio/signXActive.png',
                    x: 205,
                    y: 80,
                    width: 146,
                    height: 102,
                    title: 'Играть крестиком.',
                    value: LogicXO.SIGN_ID_X
                },
                {
                    srcRest: '/images/radio/signORest.png',
                    srcHover: '/images/radio/signOHover.png',
                    srcActive: '/images/radio/signOActive.png',
                    x: 298,
                    y: 78,
                    width: 146,
                    height: 102,
                    title: 'Играть ноликом.',
                    value: LogicXO.SIGN_ID_O
                }
            ],
            currentIndex: 0,
            onChange: LogicPageMain.onRadioSignChange
        });
        self.elements.push(element);
        /* Лента друзей */
        element = GUI.createElement(ElementFriendsType, {
            x: 138,
            y: 357,
            spacing: 79,
            columns: 5,
            friends: [],
            onClickDummy: LogicPageMain.onAddFriendButtonClick
        });
        self.elements.push(element);
        self.elementFriendsType = element;
        /* Кнопка рейтинг. */
        element = GUI.createElement(ElementButton, {
            x: 560,
            y: 350,
            width: 140,
            height: 48,
            srcRest: '/images/buttons/ratingRest.png',
            srcHover: '/images/buttons/ratingHover.png',
            srcActive: '/images/buttons/ratingActive.png',
            onClick: LogicPageMain.onRatingButtonClick
        });
        self.elements.push(element);
        /* Кнопка, добавить друга. */
        element = GUI.createElement(ElementButton, {
            x: 70,
            y: 355,
            title: 'Пригласить друзей.',
            srcRest: '/images/buttons/addFriendRest.png',
            srcHover: '/images/buttons/addFriendHover.png',
            srcActive: '/images/buttons/addFriendActive.png',
            onClick: LogicPageMain.onAddFriendButtonClick
        });
        self.elements.push(element);
        element = GUI.createElement(ElementButton, {
            x: 127,
            y: 371,
            srcRest: '/images/buttons/friendsTypeLeftRest.png',
            srcHover: '/images/buttons/friendsTypeLeftHover.png',
            srcActive: '/images/buttons/friendsTypeLeftRest.png',
            onClick: function () {
                friendsTypeOffset--;
                PageController.redraw();
            }
        });
        self.elements.push(element);
        elementFriendsTypeLeftButton = element;
        element = GUI.createElement(ElementButton, {
            x: 533,
            y: 371,
            srcRest: '/images/buttons/friendsTypeRightRest.png',
            srcHover: '/images/buttons/friendsTypeRightHover.png',
            srcActive: '/images/buttons/friendsTypeRightRest.png',
            onClick: function () {
                friendsTypeOffset++;
                PageController.redraw();
            }
        });
        self.elements.push(element);
        elementFriendsTypeRightButton = element;
    };

    /**
     * Покажем все элементы на странице.
     */
    this.show = function () {
        if (showed == true) return;
        showed = true;
        for (var i in self.elements) {
            self.elements[i].show();
        }
        self.redraw();
    };

    /**
     * Спрачем все элементы на странице.
     */
    this.hide = function () {
        if (showed == false) return;
        showed = false;
        for (var i in self.elements) {
            self.elements[i].hide();
        }
    };

    /**
     * Настройка перед отрисовкой.
     */
    this.preset = function () {
        var usersList, ids, user, currentUser;
        usersList = [];
        ids = [];
        currentUser = LogicUser.getCurrentUser();
        if (currentUser.id) {
            ids = ids.concat(LogicFriends.getFriendsById(currentUser.id));
            ids = ids.concat(LogicUser.getOnlineUserIds());
        }
        /* remove duplicates */
        var tmp;
        tmp = [];
        for (var i in ids) {
            if (ids[i] == currentUser.id) {
                continue;
            }
            tmp[ids[i]] = ids[i];
        }
        ids = tmp;
        if (ids) {
            for (var i in ids) {
                user = LogicUser.getById(ids[i]);
                if (!user) {
                    continue;
                }
                usersList.push({
                    user: user,
                    showState: true,
                    onButtonInviteClick: LogicPageMain.onInviteClick,
                    onButtonLetsPlayClick: LogicPageMain.onLetsPlayClick,
                    onButtonLookGameClick: LogicPageMain.onLookGameClick,
                    isFriend: LogicFriends.isFriend(currentUser.id, user.id)
                });
            }
        }
        /** Сортировка.
         * Сортировтаь будем так:
         * - последний раз заходил.
         * - друг;
         * - в игре;
         * - онлайн;
         */
        usersList.sort(function (a, b) {
            if (a.user.socNetUserId > b.user.socNetUserId)return -1;
            if (a.user.socNetUserId < b.user.socNetUserId)return 1;
            return 0;
        });
        usersList.sort(function (a, b) {
            if (a.user.lastLogoutTimestamp < b.user.lastLogoutTimestamp)return 1;
            if (a.user.lastLogoutTimestamp > b.user.lastLogoutTimestamp)return -1;
            return 0;
        });
        usersList.sort(function (a, b) {
            if (a.user.isFriend && !b.user.isFriend)return -1;
            if (!a.user.isFriend && b.user.isFriend)return 1;
            return 0;
        });
        usersList.sort(function (a, b) {
            if (!a.user.onGameId && b.user.onGameId)return -1;
            if (a.user.onGameId && !b.user.onGameId)return 1;
            return 0;
        });
        usersList.sort(function (a, b) {
            if (a.user.online && !b.user.online)return -1;
            if (!a.user.online && b.user.online)return 1;
            return 0;
        });

        if (friendsTypeOffset >= usersList.length - 1) {
            friendsTypeOffset = usersList.length - 1;
            elementFriendsTypeRightButton.enabled = false;
        } else {
            elementFriendsTypeRightButton.enabled = true;
        }
        if (friendsTypeOffset <= 0) {
            friendsTypeOffset = 0;
            elementFriendsTypeLeftButton.enabled = false;
        } else {
            elementFriendsTypeLeftButton.enabled = true;
        }

        self.elementFriendsType.update(usersList.slice(friendsTypeOffset));
    };

    /**
     * Обновляем онлайн индикатор и индикатор очков.
     */
    this.redraw = function () {
        if (!showed)return;
        self.preset();
        for (var i in self.elements) {
            self.elements[i].redraw();
        }
    };
};

PageBlockMain = new PageBlockMain;