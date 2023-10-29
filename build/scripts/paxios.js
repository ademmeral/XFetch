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
    request;
    controller;
    url;
    searchParams;
    interceptors;
    interceptor;
    constructor(config) {
        this.url = new URL(decodeURIComponent(config.baseUrl));
        this.searchParams = this.url.searchParams;
        this.controller = new AbortController();
        this.headers = new Headers(config.headers);
        this.initialConfig = { signal: this.controller.signal };
        this.request = {
            ...this.initialConfig,
            url: this.url,
            searchParams: this.searchParams,
            headers: this.headers
        };
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
        for (const key in conf) {
            if (key === 'headers') {
                for (const k in conf.headers)
                    this.headers.set(k, conf[k]);
            }
            else if (key === 'url') {
                for (const k in conf.url) {
                    if (k === 'pathname')
                        this.url = new URL(decodeURIComponent(conf.url.pathname), this.url.origin);
                    else if (k === 'searchParams') {
                        for (const k in conf.url.searchParams)
                            this.url.searchParams[k] = conf.url.searchParams[k];
                    }
                    else
                        this.url[k] = conf.url[k];
                }
                ;
            }
            else if (key === 'searchParams') {
                for (const k in conf.searchParams)
                    this.searchParams[k] = conf.searchParams[k];
            }
            else
                this.initialConfig = Object.assign(this.initialConfig, conf);
        }
        this.searchParams = this.url.searchParams;
        this.request.headers = this.headers;
        this.request.url = this.url;
        this.request.searchParams = this.searchParams;
        this.request = {
            ...this.request,
            ...this.initialConfig,
            headers: this.headers,
            url: this.url,
            searchParams: this.searchParams
        };
    }
    get config() {
        const proxy = Object.assign({}, this.request);
        return new Proxy(proxy, {
            get: (target, prop) => {
                if (prop === 'headers')
                    return target.headers;
                else if (prop === 'url')
                    return target.url;
                else if (prop === 'searchParams')
                    return target.searchParams;
                else
                    return target;
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
                throw new PaxiosError('You must return a config object!');
            this.config = newConfig;
        }
    }
    async handleRequest(config) {
        try {
            this.config = config;
            const request = new Request(this.request.url.href, this.request);
            await this.apply();
            const response = await fetch(request);
            return response;
        }
        catch (err) {
            if (err instanceof Error)
                throw new PaxiosError(err.message);
        }
    }
    async get(pathname) {
        return this.handleRequest({ method: 'GET', url: { pathname } });
    }
    async post(pathname, body) {
        return this.handleRequest({
            method: 'POST',
            url: { pathname },
            body: JSON.stringify(body)
        });
    }
    async put(pathname, body) {
        return this.handleRequest({
            method: 'PUT',
            url: { pathname },
            body: JSON.stringify(body)
        });
    }
    async delete(pathname, body) {
        return this.handleRequest({
            method: 'DELETE',
            url: { pathname },
            body: JSON.stringify(body)
        });
    }
}
export default Paxios;
