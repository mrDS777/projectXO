/**
 * Компонент для работы с социальной сетью.
 * @constructor
 */

// только для сервера, хм...
if (typeof window == 'undefined') {
    var MD5 = require('MD5');
    var HTTPS = require('https');
}

SocNet = function () {
    var self = this;
    var baseHost = 'api.vk.com';
    var baseUrl = '/method/';
    var getParams = {};

    var accessToken = null;

    this.parseSocNetURL = function () {
        getParams = {
            viewer_id: getQueryVariable('viewer_id'),
            api_id: getQueryVariable('api_id'),
            auth_key: getQueryVariable('auth_key'),
            secret: getQueryVariable('secret'),
            access_token: getQueryVariable('access_token')
        };
        /* Other possible GET params from VK
         api_url:http://api.vk.com/api.php
         api_id:4467180
         api_settings:8199
         viewer_id:12578187
         viewer_type:0
         sid:c57ce42cb7fefaf59d1456800cdc86a9c732b7d9e99a84cc6e00147150fd3d34532c97317c695edfdcb7c
         secret:3704c9427d
         access_token:4fe7830d6ecd2eeac26cc5a3d009fa1dcf6cb268765347fcda81f97405817420835122f29cf5834afbedf
         user_id:0
         group_id:0
         is_app_user:1
         auth_key:1bb91dabd1b8e7913c3ebb052f7d2a39
         language:0
         parent_language:0
         ad_info:ElsdCQBeRFJsBAxcAwJSXHt5C0Q8HTJXUVBBJRVBNwoIFjI2HA8E
         is_secure:0
         ads_app_id:4467180_e18d649ad35faed323
         referrer:unknown
         lc_name:fe8f8c15
         hash:;
         */
    };

    this.getAuthParams = function () {
        /*	auth_key = md5(app_id+'_'+viewer_id+'_'+app_secret); */
        return {
            authKey: getParams.auth_key,
            appId: getParams.api_id
        };
    };

    this.getSocNetUserId = function () {
        return getParams.viewer_id;
    };

    this.getSocNetTypeId = function () {
        return SocNet.TYPE_VK;
    };

    /**
     * Получить список друзей из соц сети.
     * @param socNetTypeId {Number} id социальной сети SoNet.TYPE_*
     * @param socNetUserId {Number} id юзера, в социальной сети.
     * @param callback {Function}
     */
    this.getFriends = function (socNetTypeId, socNetUserId, callback) {
        self.executeMethod('friends.get', {user_id: socNetUserId}, callback);
    };

    /**
     * Получит
     * @param socNetTypeId
     * @param socNetUserId
     * @param callback
     */
    this.getUserInfo = function (socNetTypeId, socNetUserId, callback) {
        self.executeMethod('users.get', {user_ids: socNetUserId, fields: 'photo_50,sex', https: 1}, function (source) {
                var info;
                info = {};
                info.firstName = source[0].first_name;
                info.lastName = source[0].last_name;
                info.photo50 = source[0].photo_50;
                switch (source[0].sex) {
                    case 1:
                        info.sex = SocNet.SEX_WOMAN;
                        break;
                    case 2:
                        info.sex = SocNet.SEX_MAN;
                        break;
                    default:
                        info.sex = SocNet.SEX_UNKNOWN;
                        break;
                }
                callback(info);
            }
        )
    };

    this.getUsersOnline = function (userIds, callback) {
        self.executeMethod('users.get', {user_ids: userIds.join(','), fields: 'online'}, function (sourceList) {
            var out;
            out = [];
            sourceList.forEach(function (source) {
                out[source.uid] = {socNetUserId: source.uid, online: source.online};
            });
            callback(out);
        })
    };

    /**
     * Проверка авторизации
     * @param socNetTypeId тип социальной сети SocNet.TYPE_*
     * @param socNetUserId id в социальной сети.
     * @param authParams специфичные для соц.сети данные проверки м.
     * @returns {boolean} результат аутентификации.
     */
    this.checkAuth = function (socNetTypeId, socNetUserId, authParams) {
        var generatedAuthKey;
        /*	auth_key = md5(app_id+'_'+viewer_id+'_'+app_secret); */
        generatedAuthKey = MD5(authParams.appId + '_' + socNetUserId + '_' + Config.SocNet.secretKey);
        if (generatedAuthKey != authParams.authKey) {
            Logs.log("auth key mismatch, generated:" + generatedAuthKey + " given:" + authParams.authKey);
        }
        return generatedAuthKey == authParams.authKey;
    };

    var getQueryVariable = function (variable) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == variable) {
                return pair[1];
            }
        }
        Logs.log('Query Variable ' + variable + ' not found', Logs.LEVEL_WARNING);
    };

    /**
     * Выполнить метод для соц сети. вКонтакте.
     * @param method {String}
     * @param params {Object}
     * @param callback {Function}
     */
    this.executeMethod = function (method, params, callback, isSecure) {
        var url, options, req, key, data;
        /* https://api.vk.com/method/'''METHOD_NAME'''?'''PARAMETERS'''&access_token='''ACCESS_TOKEN''' */
        url = baseUrl + method + '?';
        if (isSecure) {
            params.access_token = accessToken;
            params.client_secret = Config.SocNet.secretKey;
        }
        for (var i in params) {
            url += '&' + i + '=' + encodeURIComponent(params[i]);
        }
        options = {};
        options.hostname = baseHost;
        options.port = 443;
        options.path = url;
        options.method = 'GET';
        Logs.log("https request: " + baseHost + url, Logs.LEVEL_DETAIL);
        key = baseHost + url;
        if (data = UrlCache.get(key)) {
            Logs.log("https answer(cached): " + data, Logs.LEVEL_DETAIL);
            callback(data);
            return;
        }
        /* Далее выполняем запрос */
        req = HTTPS.request(options, function (res) {
            res.on('data', function (data) {
                Logs.log("https answer: " + data, Logs.LEVEL_DETAIL);
                try {
                    data = JSON.parse(data);
                    data = data.response;
                    UrlCache.set(key, data);
                    callback(data);
                } catch (e) {
                    Logs.log("JSON.parse error", Logs.LEVEL_WARNING, {data: data, url: url});
                }
            });
        });
        req.on('error', function (e) {
            Logs.log("SocNet.executeMethod request error:", Logs.LEVEL_ERROR, {url: url, e: e});
        });
        req.end();
    };

    /**
     * Возвращает url на профиль пользователя в социальной сети.
     * @param socNetTypeId {Number} id социальной сети SocNet.TYPE_*
     * @param socNetUserId {Number} id пользователя в соц.сети.
     * @returns {string} url на профиль пользователя в соц.сети.
     */
    this.getUserProfileUrl = function (socNetTypeId, socNetUserId) {
        return 'http://vk.com/id' + socNetUserId;
    };

    /**
     * Открыть диалог приглашения друзей.
     * @returns {boolean}
     */
    this.openInviteFriendDialog = function () {
        VK.callMethod('showInviteBox');
    };

    /**
     * Инициализация VK.
     * @see WebSocketServer : var loadClientCode {Function}
     */
    this.VKInitClient = function () {
        var apiVersoin, onSuccess, onFail, apiVersion;
        apiVersion = '5.28';
        onSuccess = function () {
            Logs.log("VK client API inited.", Logs.LEVEL_NOTIFY);
        };
        onFail = function () {
            // @todo send fail to server? may be...
            alert('Произошла ошибка доступа к вКонтакте, обратитесь к автору приложения.');
        };
        VK.init(onSuccess, onFail, apiVersion);
    };

    /**
     * oAuth авторизация на вКонтакте.
     * Выполнит запрос.
     * https:// oauth.vk.com /access_token ? client_id = appId & client_secret = secretKey & v = 5.29 [ & grant_type = client_credentials ]
     * @see http://vk.com/dev/auth_server
     * @see http://vk.com/dev/oauth_gettoken
     */
    this.oAuthorization = function (callback) {
        var url, options, req;

        url = "/access_token?client_id=" + Config.SocNet.appId + "&client_secret=" + Config.SocNet.secretKey + "&v=5.28&grant_type=client_credentials";
        host = 'oauth.vk.com';

        options = {};
        options.hostname = host;
        options.port = 443;
        options.path = url;
        options.method = 'GET';
        Logs.log("https request(oAuth): " + host + url, Logs.LEVEL_NOTIFY);
        /* Далее выполняем запрос */
        req = HTTPS.request(options, function (res) {
            res.on('data', function (data) {
                Logs.log("https answer(oAuth): " + data, Logs.LEVEL_NOTIFY);
                try {
                    data = JSON.parse(data.toString());
                    if (data.error) {
                        Logs.log("error (oAuth)", Logs.LEVEL_WARNING, data);
                    }
                    accessToken = data.access_token;
                    callback();
                } catch (e) {
                    Logs.log("JSON.parse error(oAuth)", Logs.LEVEL_WARNING, data);
                }
            });
        });
        req.on('error', function (e) {
            Logs.log("SocNet.executeMethod request error:", Logs.LEVEL_ERROR, e);
        });
        req.end();
    };

    this.init = function (afterInitCallback) {
        self.oAuthorization();
        afterInitCallback();
    };
};
/**
 * Статичный класс.
 * @type {SocNet}
 */
SocNet = new SocNet();
/**
 * Тип социальной сети, вКонтакте.
 * @type {number}
 */
SocNet.TYPE_VK = 1;
/**
 * Константа пол: неизвестен\неустановлен.
 * @type {number}
 */
SocNet.SEX_UNKNOWN = 1;
/**
 * Константа пол: женский.
 * @type {number}
 */
SocNet.SEX_WOMAN = 2;
/**
 * Константа пол: мужской
 * @type {number}
 */
SocNet.SEX_MAN = 3;
