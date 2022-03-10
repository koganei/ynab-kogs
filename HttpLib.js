const { Message, ProxyResolverDefault, SessionAsync, MessageHeaders, MessageHeadersType } = imports.gi.Soup;

class HttpLib {
    constructor() {
        this._httpSession = new SessionAsync();
        this._httpSession.user_agent = "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:37.0) Gecko/20100101 Firefox/37.0";
        this._httpSession.timeout = 10;
        this._httpSession.idle_timeout = 10;
        this._httpSession.add_feature(new ProxyResolverDefault());
    }
    static get Instance() {
        if (this.instance == null)
            this.instance = new HttpLib();
        return this.instance;
    }
    async LoadJsonAsync(url, params, headers, method = "GET") {
        const response = await this.LoadAsync(url, params, headers, method);
        try {
            const payload = JSON.parse(response.Data);
            response.Data = payload;
        }
        catch (e) {
            if (e instanceof Error)
                global.logError("Error: API response is not JSON. The response: " + response.Data, e);
            if (response.Success) {
                response.Success = false;
                response.ErrorData = {
                    code: -1,
                    message: "bad api response - non json",
                    reason_phrase: "",
                };
            }
        }
        finally {
            return response;
        }
    }
    async LoadAsync(url, params, headers, method = "GET") {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const message = await this.Send(url, params, headers, method);
        let error = undefined;
        if (!message) {
            error = {
                code: 0,
                message: "no network response",
                reason_phrase: "no network response",
                response: undefined
            };
        }
        else if (message.status_code < 100 && message.status_code >= 0) {
            error = {
                code: message.status_code,
                message: "no network response",
                reason_phrase: message.reason_phrase,
                response: message
            };
        }
        else if (message.status_code > 300 || message.status_code < 200) {
            error = {
                code: message.status_code,
                message: "bad status code",
                reason_phrase: message.reason_phrase,
                response: message
            };
        }
        else if (!message.response_body) {
            error = {
                code: message.status_code,
                message: "no response body",
                reason_phrase: message.reason_phrase,
                response: message
            };
        }
        else if (!message.response_body.data) {
            error = {
                code: message.status_code,
                message: "no response data",
                reason_phrase: message.reason_phrase,
                response: message
            };
        }
        const responseHeaders = {};
        (_a = message === null || message === void 0 ? void 0 : message.response_headers) === null || _a === void 0 ? void 0 : _a.foreach((name, val) => {
            responseHeaders[name] = val;
        });
        if (((_b = message === null || message === void 0 ? void 0 : message.status_code) !== null && _b !== void 0 ? _b : -1) > 200 && ((_c = message === null || message === void 0 ? void 0 : message.status_code) !== null && _c !== void 0 ? _c : -1) < 300) {
            global.log("Warning: API returned non-OK status code '" + (message === null || message === void 0 ? void 0 : message.status_code) + "'");
        }
            // global.log("API full response: " + ((_e = (_d = message === null || message === void 0 ? void 0 : message.response_body) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.toString()));
        if (error != null)
            global.logError("Error calling URL: " + error.reason_phrase + ", " + ((_g = (_f = error === null || error === void 0 ? void 0 : error.response) === null || _f === void 0 ? void 0 : _f.response_body) === null || _g === void 0 ? void 0 : _g.data));
        return {
            Success: (error == null),
            Data: (_h = message === null || message === void 0 ? void 0 : message.response_body) === null || _h === void 0 ? void 0 : _h.data,
            ResponseHeaders: responseHeaders,
            ErrorData: error,
            Response: message
        };
    }
    async Send(url, params, headers, method = "GET") {
        if (params != null) {
            const items = Object.keys(params);
            for (const [index, item] of items.entries()) {
                url += (index == 0) ? "?" : "&";
                url += (item) + "=" + params[item];
            }
        }
        const query = encodeURI(url);
        global.log("URL called: " + query);
        const data = await new Promise((resolve, reject) => {
            const message = Message.new(method, query);
            if (message == null) {
                resolve(null);
            }
            else {
                if (headers != null) {
                    for (const key in headers) {
                        message.request_headers.append(key, headers[key]);
                    }
                }
                this._httpSession.queue_message(message, (session, message) => {
                    resolve(message);
                });
            }
        });
        return data;
    }
}