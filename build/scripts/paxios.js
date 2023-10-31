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
    config;
    headers;
    controller;
    url;
    middlewares;
    interceptors;
    constructor(config) {
        this.config = config;
        this.url = new URL(decodeURIComponent(config.baseUrl));
        this.controller = new AbortController();
        this.headers = new Headers(config.headers);
        this.middlewares = {
            request: new Set(),
            response: new Set(),
        };
        this.interceptors = {
            request: {
                use: (callback) => {
                    this.middlewares.request.add(callback);
                },
                eject: (callback) => {
                    this.middlewares.request.delete(callback);
                },
            },
            response: {
                use: (callback) => {
                    this.middlewares.response.add(callback);
                },
                eject: (callback) => {
                    this.middlewares.response.delete(callback);
                },
            },
        };
    }
    static create = (config) => {
        const newInst = new Paxios(config);
        newInst.setConfig(config);
        return newInst;
    };
    cancel() {
        this.controller.abort('User canceled!');
    }
    resume() {
        this.controller = new AbortController();
    }
    setHeaders(config) {
        for (const key in config)
            this.headers.set(key, config[key]);
    }
    appendToHeaders(config) {
        for (const key in config)
            this.headers.append(key, config[key]);
    }
    setUrl(config) {
        for (const key in config)
            if (!(key in this.url))
                throw new PaxiosError(`${key} cannot be assigned to URL Object!`);
            else if (key === 'searchParams')
                for (const k in config[key])
                    this.url.searchParams.set(k, config[key][k]);
            else
                this.url[key] = config[key];
    }
    setConfig(config) {
        const excludedKeys = ['headers', 'url', 'baseUrl'];
        if ('headers' in config)
            this.setHeaders(config.headers);
        if ('url' in config)
            this.setUrl(config.url);
        for (const key in config) {
            if (excludedKeys.some(k => k === key))
                continue;
            this.config[key] = config[key];
        }
    }
    ;
    typeController(firstItem, secondItem) {
        const firstItemConst = firstItem.constructor.name;
        const secondItemConst = secondItem.constructor.name;
        if (firstItemConst !== secondItemConst)
            throw new PaxiosError(`You cannot assign ${secondItemConst} to ${firstItemConst}`);
        else
            return true;
    }
    async apply() {
        for await (const fn of this.middlewares.request)
            await fn();
    }
    async handleRequest(config) {
        try {
            if (this.controller.signal.aborted)
                throw new Error('Request has been canceled!');
            this.setConfig(config);
            const newRequest = Object.assign({}, this.config);
            newRequest.signal = this.controller.signal;
            const request = new Request(this.url.href, newRequest);
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
