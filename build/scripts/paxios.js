class Paxios {
    config;
    baseUrl;
    controller;
    interceptors;
    interceptor;
    // constructor
    constructor(config) {
        this.baseUrl = config.baseUrl; // base_url
        this.controller = new AbortController(); // controller
        this.config = {
            signal: this.controller.signal,
            ...config,
            headers: { ...config.headers }
        };
        // interceptors
        this.interceptors = {
            request: new Set(),
            response: new Set()
        };
        // Setting interceptors
        this.interceptor = {
            request: {
                use: (callback) => {
                    this.interceptors.request.add(callback);
                },
                eject: (fn) => {
                    this.interceptors.request.delete(fn);
                }
            },
            response: {
                use: (callback) => {
                    this.interceptors.request.add(callback);
                },
                eject: (callback) => {
                    this.interceptors.request.delete(callback);
                }
            }
        };
    }
    // new instance
    static create = (config = {}) => new Paxios(config);
    // cancellation
    cancel() {
        this.controller.abort();
        this.config = {
            ...this.config,
            signal: this.controller.signal
        };
    }
    // resumption
    resume() {
        this.controller = new AbortController();
        this.config = {
            ...this.config,
            signal: this.controller.signal
        };
    }
    async apply(config) {
        for (const fn of this.interceptors.request) {
            fn(config);
        }
        ;
        return config;
    }
    // request
    async request(config) {
        await this.apply(config);
        const resp = await fetch(config.url, config);
        if (resp.ok)
            return resp;
        throw new Error('An error has occured while fetching. Plase try again!');
    }
    // methods
    async get(path, conf) {
        return await this.request({
            ...this.config,
            ...conf,
            method: 'GET',
            url: this.baseUrl + path
        });
    }
    async post(path, conf) {
        return await this.request({
            ...this.config,
            ...conf,
            headers: {
                'Content-Type': 'application/json',
                ...conf.headers
            },
            method: 'POST',
            url: this.baseUrl + path,
            body: JSON.stringify({ ...conf.body })
        });
    }
    async put(path, conf) {
        return await this.request({
            ...this.config,
            ...conf,
            headers: {
                'Content-Type': 'application/json',
                ...conf.headers
            },
            method: 'PUT',
            url: this.baseUrl + path,
            body: JSON.stringify({ ...conf.body })
        });
    }
    async delete(path, conf) {
        return await this.request({
            ...this.config,
            ...conf,
            method: 'DELETE',
            url: this.baseUrl + path
        });
    }
}
export default Paxios;
