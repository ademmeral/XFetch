// paxios.ts
class PaxiosError extends Error {
    date;
    constructor(message) {
        super(message);
        this.name = 'PaxiosError';
        this.message = message;
        this.date = new Date();
    }
}
class Paxios {
    initialConfig;
    headers;
    controller;
    baseUrl;
    url;
    interceptors;
    interceptor;
    constructor(config) {
        this.baseUrl = config.baseUrl;
        this.url = new URL(this.baseUrl);
        this.controller = new AbortController();
        this.initialConfig = Object.defineProperty({}, 'signal', { value: this.controller.signal });
        this.headers = new Headers(config.headers);
        this.interceptors = {
            request: new Set(),
            response: new Set(),
        };
        // Setting interceptors
        this.interceptor = {
            request: {
                use: (callback) => {
                    this.interceptors.request.add(callback);
                },
                eject: (callback) => {
                    this.interceptors.request.delete(callback);
                },
            },
            response: {
                use: (callback) => {
                    this.interceptors.response.add(callback);
                },
                eject: (callback) => {
                    this.interceptors.response.delete(callback);
                },
            },
        };
    }
    set config(conf) {
        const pickProps = Object.keys(conf)
            .reduce((a, c) => {
            if (c !== 'headers')
                a[c] = conf[c];
            else
                this.headers.set(c, conf.headers[c]);
            return a;
        }, {});
        this.initialConfig = Object.assign(this.initialConfig, pickProps);
    }
    get config() {
        return new Proxy(this.initialConfig, {
            get: (target, prop) => {
                if (prop in target)
                    return target[prop];
                else
                    return null;
            }
        });
    }
    ;
    static create = (config) => {
        const newInst = new Paxios(config);
        newInst.config = config;
        return newInst;
    };
    cancel() {
        this.controller.abort();
    }
    resume() {
        this.controller = new AbortController();
    }
    async apply() {
        for await (const fn of this.interceptors.request) {
            const newConfig = await fn();
            if (this.interceptors.request.size > 0 && !newConfig)
                throw new PaxiosError('You must return config!');
            this.initialConfig = Object.assign(this.initialConfig, newConfig);
            for (const key in newConfig.headers)
                this.headers.set(key, newConfig.headers[key]);
        }
    }
    setRequest(config) {
        this.url = new URL(`${this.baseUrl}${config.path}`);
        const requestInit = Object.defineProperties(Object.assign(this.initialConfig, config), {
            headers: {
                value: this.headers,
                writable: true
            },
            url: {
                value: this.url,
                writable: true
            }
        });
        const request = new Request(this.url.href, requestInit);
        return request;
    }
    async request(config) {
        try {
            await this.apply();
            const resp = await fetch(this.setRequest(config));
            return resp;
        }
        catch (err) {
            if (err instanceof Error)
                throw new PaxiosError(err.message);
        }
    }
    async get(path) {
        return this.request({ method: 'GET', path });
    }
    async post(path, body) {
        return this.request({
            method: 'POST',
            path,
            body: JSON.stringify(body)
        });
    }
    async put(path, body) {
        return this.request({
            method: 'PUT',
            path,
            body: JSON.stringify(body)
        });
    }
    async delete(path, body) {
        return this.request({
            method: 'DELETE',
            path,
            body: JSON.stringify(body)
        });
    }
}
export default Paxios;
