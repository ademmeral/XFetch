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
    baseUrl;
    controller;
    interceptors;
    interceptor;
    constructor(config) {
        this.baseUrl = config.baseUrl;
        this.controller = new AbortController();
        this.initialConfig = Object.defineProperty(Object.create(config), 'signal', {
            value: this.controller.signal
        });
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
    set config(param) {
        this.initialConfig = Object.assign(this.initialConfig, param);
    }
    get config() { return this.initialConfig; }
    ;
    static create = (config) => new Paxios(config);
    cancel() {
        this.controller.abort();
        this.initialConfig.signal = this.controller.signal;
    }
    resume() {
        this.controller = new AbortController();
        this.initialConfig.signal = this.controller.signal;
    }
    async apply(config) {
        for await (const fn of this.interceptors.request) {
            const newConfig = await fn(config);
            if (this.interceptors.request.size > 0 && !newConfig)
                throw new PaxiosError('You must return config!');
            this.initialConfig = Object.assign(this.initialConfig, newConfig);
            this.headers = new Headers(Object.assign(this.headers, config.headers));
        }
    }
    setRequest(config) {
        // if ('headers' in config) {
        //   for (const key in config.headers){
        //     headers.append(key, config.headers[key])
        //   }
        // }
        const requestInit = Object.defineProperty(Object.assign(this.initialConfig, config), 'headers', {
            value: Object.assign(this.headers, config.headers),
            writable: false
        });
        const request = new Request(this.baseUrl + config.path, requestInit);
        return request;
    }
    async request(config) {
        try {
            await this.apply(config);
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
    async post(path, conf) {
        return this.request({
            method: 'POST',
            path,
            body: { value: JSON.stringify(conf.body) }
        });
    }
    async put(path, conf) {
        return this.request({
            method: 'PUT',
            path,
            body: { value: JSON.stringify(conf.body) }
        });
    }
    async delete(path, conf) {
        return this.request({
            method: 'DELETE',
            path,
            body: { value: JSON.stringify(conf.body) }
        });
    }
}
export default Paxios;
