/**
 * Компонент обеспечивающий соединение с сервером.
 * @constructor
 */
WebSocketClient = function () {
    var self = this;

    /**
     * Хост сервера.
     * @type {string}
     */
    var host = null;

    /**
     * id соединиения.
     * Если вдруг у нас несколько соединений.
     * @type {null}
     */
    var connectionId = null;

    /**
     * Порт сервера.
     * @type {int}
     */
    var port = null;
    this.setup = function (setup) {
        if (setup.port)port = setup.port;
        if (setup.host)host = setup.host;
    };
    this.onData = null;
    this.onConnect = null;
    this.onDisconnect = null;

    /**
     * Сюда мы будем получать данные и отправлять их на сервер.
     * Примечание: Однако, если соединения с серверм нет, то мы будем просто добавлять их в буффер.
     * @param data string
     */
    this.sendData = function (data) {
        packetBuffer.push(data);
        setTimeout(trySend, 50);
        return true;
    };

    /**
     * Просто выполним инициализацию.
     * Собсвтено подсоединимся к серверу.
     */
    this.run = function () {
        checkBeforeInit();
        init();
    };
    var checkBeforeInit = function () {
        if (typeof  self.onConnect != 'function') {
            Logs.log("onConnect must be function", Logs.LEVEL_FATAL_ERROR, self.onConnect);
        }
        if (typeof  self.onDisconnect != 'function') {
            Logs.log("onConnect must be function", Logs.LEVEL_FATAL_ERROR, self.onDisconnect);
        }
        if (typeof  self.onData != 'function') {
            Logs.log("onConnect must be function", Logs.LEVEL_FATAL_ERROR, self.onData);
        }
    };

    /**
     * Состояние соединения:
     * true - соединение активно
     * false - нет соединения.
     */
    var isConnected = false;

    /**
     * Буфер пакетов данных.
     * Впервую очередь все данные попадают сюда, а уже потом отправляются.
     * На случай, если нет соединения сейчас, но оно появиться потом.
     */
    var packetBuffer = [];

    /**
     * Собственно сокет.
     * @type {null}
     */
    var socket = null;

    /**
     * Инициалиизация.
     * Создадим объект клиента
     * Установим обработчики.
     */
    var init = function () {
        Logs.log("WebSocketClient запущен.");
        connect();
    };

    /**
     * Реализовать коннект.
     */
    var connect = function () {
        uri = "ws://" + host + ":" + port + "/ws";
        socket = new WebSocket(uri);
        /* установим обработчики. */
        socket.onopen = onOpen;
        socket.onclose = onClose;
        socket.onmessage = onMessage;
        socket.onerror = onError;
    };

    /**
     * Обработчик при открытии соединения.
     */
    var onOpen = function () {
        isConnected = true;
        /* На случай, если буфер не пуст. */
        trySend();
        Logs.log("WebSocketClient: Соединение установленно:" + host + ':' + port);
        connectionId = ++WebSocketClient.connectionId;
        self.onConnect(connectionId);
    };

    /**
     * Обработчик при закрытие соединения.
     * @param event
     */
    var onClose = function (event) {
        isConnected = false;
        if (event.wasClean) {
            Logs.log("WebSocketClient: Соединение закрыто успешно.");
        } else {
            Logs.log("WebSocketClient: Соединение закрыто, отсутствует соединение.");
        }
        Logs.log('WebSocketClient: Код: ' + event.code + ' причина: ' + event.reason);
        self.onDisconnect(connectionId);
        tryReconnect();
    };

    var tryReconnect = function () {
        if (isConnected == false) {
            Logs.log('Try reconnect', Logs.LEVEL_NOTIFY);
            connect();
            /* Попытка реконнетка, через некоторое время */
            setTimeout(tryReconnect, 8958);
        }
    };

    /**
     * Обработчик при получении данных(сообщения) от сервера.
     * @param event
     */
    var onMessage = function (event) {
        /* Logs.log("WebSocketClient: Получены данные.", Logs.LEVEL_DETAIL, event.data); */
        self.onData(event.data, connectionId);
    };

    /**
     * Обработчик ошибок вебсокета.
     * @param error
     */
    var onError = function (error) {
        Logs.log("WebSocketClient: Ошибка " + error.message);
    };

    /**
     * Отправка данных из буфера.
     * Если нет данных в буфере возвращаемся.
     * Если нет соединения, то пробуем отправить их позже.
     * Берем пакет из буфера, удаляе его из буфера.
     * Отправляем пакет на сервер.
     * Если в буфере еще есть данные, пробуем их отправить позже.
     */
    var trySend = function () {
        var data;
        // если буфер пуст - уходим.
        if (!packetBuffer.length) {
            return;
        }
        /* Если нет соединения пробуем позже. */
        if (!isConnected) {
            setTimeout(trySend, self.trySendTimeout);
            return;
        }
        /* Берем элемент из буфера. */
        data = packetBuffer.shift();
        socket.send(data);
        /* Logs.log("WebSocketClient.send data: length=" + data.length, Logs.LEVEL_DETAIL); */
        /* Остальные данные отправим позже. */
        if (packetBuffer.length) {
            setTimeout(trySend, self.trySendTimeout);
        }
    };
};

/**
 * По сути это просто номер соединения в пределах жизни скрипта.
 */
WebSocketClient.connectionId = 0;