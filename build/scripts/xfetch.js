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
                throw new XFetchError(`${key} cannot be assigned to URL Object!`);
            else if (key === 'searchParams')
                for (const k in config[key])
                    this.url.searchParams.set(k, config[key][k]);
            else
                this.url[key] = config[key];
    }
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
    ;
    async getAll(pathnames) {
        const fetchData = async (path) => {
            try {
                return await (await fetch(decodeURIComponent(this.url.origin + path))).json();
            }
            catch (err) {
                if (err instanceof Error)
                    throw new XFetchError(err.message);
            }
        };
        return await Promise.all(pathnames.map(pn => fetchData.bind(this)(pn)));
        // no one/nothing can exist at two or more place at the same time, can they? (Function.bind)
    }
    ;
    clone(obj) {
        const clonedObj = {};
        for (const k in obj)
            clonedObj[k] = obj[k];
        return clonedObj;
    }
    ;
    async getFileWithProgress(pathname, onProgress) {
        try { // It is pretty easy with XMLHttpReques because it has a progress event coming from ProgressEvent
            const newUrl = decodeURIComponent(new URL(pathname, this.url.origin).href);
            const { headers } = await fetch(newUrl, { method: 'HEAD' });
            const type = headers.get('Content-Type');
            const totalLength = +headers.get('Content-Length');
            const resp = await fetch(newUrl);
            const reader = resp.body.getReader();
            const loaded = [];
            let loadedLength = 0;
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                loadedLength += value.length;
                loaded.push(value);
                if (onProgress)
                    onProgress({ loaded, loadedLength, totalLength });
            }
            const blob = new Blob(loaded, { type });
            const url = new URL(URL.createObjectURL(blob));
            return [new Response(blob), url];
        }
        catch (err) {
            if (err instanceof Error)
                throw new XFetchError(err.message);
        }
    }
    ;
}
export default XFetch;
