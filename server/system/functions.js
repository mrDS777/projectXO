/**
 * В этом файле содержаться системные функции.
 */

/**
 * Логи на этапах создания.
 * @param message
 */
log = function (message) {
    console.log(message);
};

/**
 * Ошибка создания, выводит сообщение и завершает работу.
 * @param message
 */
error = function (message) {
    console.log("Ошибка: " + message);
    process.exit();
};

/* Функционал для последовательной инициализации компонент. */
var sequencedInitStack = [];
var sequencedInitBlocked = false;

/**
 * Выполнить очередной инит по завершению всех предыдущих.
 * @param initFunction {function}
 */
sequencedInit = function (initFunction) {
    sequencedInitStack.push(initFunction);
    tryInitNext();
};

var tryInitNext = function () {
    if (!sequencedInitStack.length) {
        log("Init stack empty now.");
        return;
    }
    if (sequencedInitBlocked) return;
    sequencedInitBlocked = true;
    initFunction = sequencedInitStack.shift();
    initFunction(function () {
        sequencedInitBlocked = false;
        tryInitNext();
    });
};

/**
 * Динициализация\остановка системы.
 */
var deInitCallbacks = [];
addDeInitCallback = function (callback) {
    deInitCallbacks.push(callback);
};

deInitBeforeShutdown = function (callback) {
    var count;
    count = 0;
    log("Deinit callbacks is raised.");
    for (var i in deInitCallbacks) {
        deInitCallbacks[i].call(null, function () {
            count++;
        });
    }
    log("de inits completed.");
    setTimeout(callback, 1235);
};

/**
 * При вызове process.exit(), выполниться каллбэки деинициализации.
 */
process.on('exit', function () {
    log("on Exit raized!");
});

/**
 * Перехыватываем ошибки!
 */
process.on('uncaughtException', function (err) {
    log('ERROR HAPPENDZ');
    console.log(err.stack);
    process.exit();
});

/**
 *
 *  Javascript string pad
 *  http://www.webtoolkit.info/
 *
 **/

var STR_PAD_LEFT = 1;
var STR_PAD_RIGHT = 2;
var STR_PAD_BOTH = 3;

str_pad = function (str, len, pad, dir) {

    if (typeof(len) == "undefined") {
        var len = 0;
    }
    if (typeof(pad) == "undefined") {
        var pad = ' ';
    }
    if (typeof(dir) == "undefined") {
        var dir = STR_PAD_RIGHT;
    }

    if (len + 1 >= str.length) {

        switch (dir) {

            case STR_PAD_LEFT:
                str = Array(len + 1 - str.length).join(pad) + str;
                break;

            case STR_PAD_BOTH:
                var right = Math.ceil((padlen = len - str.length) / 2);
                var left = padlen - right;
                str = Array(left + 1).join(pad) + str + Array(right + 1).join(pad);
                break;

            default:
                str = str + Array(len + 1 - str.length).join(pad);
                break;

        } // switch

    }
    return str;
};

/**
 * Возвращает время в секундах.
 */
time = function () {
    return Math.floor((new Date()).getTime() / 1000);
};

/**
 * Возвращает время в миллисекундах секундах.
 */
mtime = function () {
    return new Date().getTime();
};
