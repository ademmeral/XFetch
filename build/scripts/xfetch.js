// XFetch.ts
class XFetchError extends Error {
    date;
    constructor(message) {
        super(message);
        this.name = 'XFetchError';
        this.message = message;
        this.date = new Date();
    }
}
class XFetch {
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
        this.headers = new Headers(Object.defineProperty(Object.assign({}, config.headers), 'x-requested-with', { value: 'XFetch' }));
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
        const newInst = new XFetch(config);
        newInst.setConfig(config);
        return newInst;
    };
    cancel() {
        this.controller.abort('User canceled!');
    }
    resume() {
        this.controller = new AbortController();
    }
    ;
    setHeaders(config) {
        for (const key in config)
            this.headers.set(key, config[key]);
    }
    ;
    appendToHeaders(config) {
        for (const key in config)
            this.headers.append(key, config[key]);
    }
    ;
    setUrl(config) {
        for (const key in config)
            if (!(key in this.url))
                throw new XFetchError(`${key} cannot be assigned to URL Object!`);
            else if (key === 'searchParams')
                for (const k in config[key])
                    this.url.searchParams.set(k, config[key][k]);
            else
                this.url[key] = config[key];
    }
    ;
    setConfig(config) {
        const excludedKeys = ['headers', 'url', 'baseUrl', 'searchParams'];
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
    compareTypes(firstItem, secondItem, throws = true) {
        const firstItemConst = firstItem.constructor.name;
        const secondItemConst = secondItem.constructor.name;
        if (firstItemConst !== secondItemConst) {
            if (throws)
                throw new XFetchError(`You cannot assign ${secondItemConst} to ${firstItemConst}`);
            else
                false;
        }
        else
            return true;
    }
    ;
    clone(obj) {
        const clonedObj = {};
        for (const k in obj)
            clonedObj[k] = obj[k];
        return clonedObj;
    }
    ;
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
            if (['HEAD', 'GET'].includes(config.method.toUpperCase()))
                delete config.body;
            newRequest.signal = this.controller.signal;
            const decodedHref = decodeURIComponent(this.url.href);
            const request = new Request(decodedHref, newRequest);
            await this.apply();
            const response = await fetch(request);
            return response;
        }
        catch (err) {
            if (err instanceof Error)
                throw new XFetchError(err.message);
        }
    }
    async get(pathname) {
        return this.handleRequest.bind(this)({ method: 'GET', url: { pathname } });
    }
    async post(pathname, body) {
        return this.handleRequest.bind(this)({
            method: 'POST',
            url: { pathname },
            body: JSON.stringify(body)
        });
    }
    async put(pathname, body) {
        return this.handleRequest.bind(this)({
            method: 'PUT',
            url: { pathname },
            body: JSON.stringify(body)
        });
    }
    async delete(pathname, body) {
        return this.handleRequest.bind(this)({
            method: 'DELETE',
            url: { pathname },
            body: JSON.stringify(body)
        });
    }
    ;
    async head(pathname) {
        return this.handleRequest.bind(this)({ method: 'HEAD', url: { pathname } });
    }
    async getAll(pathnames) {
        return await Promise.all(pathnames.map(async (pn) => await (await this.get(pn)).json()));
    }
    ;
    async getFileWithProgress(pathname, onProgress) {
        try { // It is pretty easy with XMLHttpReques because it has a progress event coming from ProgressEvent
            const { headers } = await this.head(pathname);
            const type = headers.get('Content-Type');
            const resp = await this.get(pathname);
            const reader = resp.body.getReader();
            const info = {
                totalLength: +headers.get('Content-Length'),
                chunks: [],
                chunksLength: 0,
                cancel: reader.cancel,
                closed: reader.closed
            };
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                info.chunksLength += value.length;
                info.chunks.push(value);
                if (!!onProgress)
                    onProgress(info);
            }
            const blob = new Blob(info.chunks, { type });
            const url = new URL(URL.createObjectURL(blob));
            return [resp, blob, url];
        }
        catch (err) {
            if (err instanceof Error)
                throw new XFetchError(err.message);
        }
    }
    ;
}
export default XFetch;
