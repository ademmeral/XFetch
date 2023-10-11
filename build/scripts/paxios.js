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
    baseUrl;
    controller;
    interceptors;
    interceptor;
    constructor(config) {
        this.baseUrl = config.baseUrl;
        this.controller = new AbortController();
        this.config = {
            signal: this.controller.signal,
            ...config,
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
    static create = (config) => new Paxios(config);
    cancel() {
        this.controller.abort();
        this.config = {
            ...this.config,
            signal: this.controller.signal,
        };
    }
    resume() {
        this.controller = new AbortController();
        this.config = {
            ...this.config,
            signal: this.controller.signal,
        };
    }
    async apply(config) {
        for (const fn of this.interceptors.request) {
            fn(config);
        }
        return config;
    }
    async request(config) {
        try {
            await this.apply(config);
            return await fetch(config.url, config);
        }
        catch (err) {
            if (err instanceof Error)
                throw new PaxiosError(err.message);
            throw new PaxiosError('An error occurred during the request');
        }
    }
    async get(path, conf) {
        return this.request({
            ...this.config,
            ...conf,
            method: 'GET',
            url: this.baseUrl + path,
        });
    }
    async post(path, conf) {
        return this.request({
            ...this.config,
            ...conf,
            method: 'POST',
            url: this.baseUrl + path,
            body: JSON.stringify(conf.body),
        });
    }
    async put(path, conf) {
        return this.request({
            ...this.config,
            ...conf,
            method: 'PUT',
            url: this.baseUrl + path,
            body: JSON.stringify(conf.body),
        });
    }
    async delete(path, conf) {
        return this.request({
            ...this.config,
            ...conf,
            method: 'DELETE',
            url: this.baseUrl + path,
        });
    }
}
export default Paxios;
