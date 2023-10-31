// XFetch.ts

class XFetchError extends Error {
  date: Date;

  constructor(message: string) {
    super(message);
    this.name = 'XFetchError';
    this.message = message;
    this.date = new Date();
  }
}

class XFetch {
  config : XFetchConfig
  headers: XFetchHeaders;
  controller: XFetchController;
  url: XFetchURL;
  middlewares: XFetchMiddlewares;
  interceptors: XFetchinterceptors;

  constructor(config: XFetchConfig) {
    this.config = config;
    this.url = new URL(decodeURIComponent(config.baseUrl));
    this.controller = new AbortController();
    this.headers = new Headers(
      Object.defineProperty(
        Object.assign({}, config.headers),
        'x-requested-with', { value: 'XFetch' }
      )
    );
    this.middlewares = {
      request: new Set(),
      response: new Set(),
    };

    this.interceptors = {
      request: {
        use: (callback: XFetchCallback) => {
          this.middlewares.request.add(callback);
        },
        eject: (callback: XFetchCallback) => {
          this.middlewares.request.delete(callback);
        },
      },
      response: {
        use: (callback: XFetchCallback) => {
          this.middlewares.response.add(callback);
        },
        eject: (callback: XFetchCallback) => {
          this.middlewares.response.delete(callback);
        },
      },
    };
  }

  static create = (config: XFetchConfig): XFetch => {
    const newInst = new XFetch(config);
    newInst.setConfig(config);
    return newInst;
  };

  cancel(): void {
    this.controller.abort('User canceled!');
  }

  resume(): void {
    this.controller = new AbortController();
  }

  setHeaders(config: XFetchConfig){
    for (const key in config)
      this.headers.set(key, config[key]);
  }
  appendToHeaders(config: XFetchConfig){
    for (const key in config)
      this.headers.append(key, config[key]);
  }
  setUrl(config:XFetchConfig){
    for (const key in config)
      if (!(key in this.url)) 
        throw new XFetchError(`${key} cannot be assigned to URL Object!`);
      else if (key === 'searchParams')
        for (const k in config[key])
        this.url.searchParams.set(k, config[key][k])
      else (this.url as any)[key] = config[key];
  }
  setConfig(config: XFetchConfig){
    const excludedKeys = ['headers', 'url', 'baseUrl', 'searchParams']
    if ('headers' in config)
      this.setHeaders(config.headers);
    if ('url' in config)
      this.setUrl(config.url);
    for (const key in config) {
      if (excludedKeys.some(k => k === key)) continue;
      this.config[key] = config[key];
    }
  };

  compareTypes(firstItem:Object, secondItem:Object, throws = true){
    const firstItemConst = firstItem.constructor.name;
    const secondItemConst = secondItem.constructor.name;
    if (firstItemConst !== secondItemConst ) {
      if (throws) throw new XFetchError(`You cannot assign ${secondItemConst} to ${firstItemConst}`)
      else false
    } else return true;
  }

  private async apply(): Promise<void> {
    for await (const fn of this.middlewares.request) await fn();
  }

  async handleRequest(config: XFetchConfig): Promise<XFetchResponse> {

    try {

      if (this.controller.signal.aborted)
        throw new Error('Request has been canceled!');
      
      this.setConfig(config);
      const newRequest = Object.assign({}, this.config);
      newRequest.signal = this.controller.signal;
      const decodedHref = decodeURIComponent(this.url.href); 
      const request = new Request(decodedHref, newRequest);
      
      await this.apply();
      const response = await fetch(request);
      return response;

    } catch (err) {
      if (err instanceof Error)
        throw new XFetchError(err.message);
    }
  }
  async get(pathname: string): Promise<XFetchResponse> {
    return this.handleRequest({ method: 'GET', url: { pathname } });
  }

  async post(pathname: string, body: XFetchConfig): Promise<XFetchResponse> {
    return this.handleRequest({
      method: 'POST',
      url: { pathname },
      body: JSON.stringify(body)
    });
  }

  async put(pathname: string, body: XFetchConfig): Promise<XFetchResponse> {
    return this.handleRequest({
      method: 'PUT',
      url: { pathname },
      body: JSON.stringify(body)
    });
  }

  async delete(pathname: string, body: XFetchConfig): Promise<XFetchResponse> {
    return this.handleRequest({
      method: 'DELETE',
      url: { pathname },
      body: JSON.stringify(body)
    });
  };

}

export default XFetch;