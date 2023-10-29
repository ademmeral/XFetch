// paxios.ts

class PaxiosError extends Error {
  date: Date;

  constructor(message: string) {
    super(message);
    this.name = 'PaxiosError';
    this.message = message;
    this.date = new Date();
  }
}

class Paxios {
  initialConfig: PaxiosConfig;
  headers: PaxiosHeaders;
  request : PaxiosRequest;
  controller: AbortController;
  url: PaxiosURL;
  searchParams : PaxiosSearchParams
  interceptors: PaxiosInterceptors;
  interceptor: PaxiosInterceptorInit;

  constructor(config: PaxiosConfig) {

    this.url = new URL(decodeURIComponent(config.baseUrl));
    this.searchParams = this.url.searchParams;
    this.controller = new AbortController();
    this.headers = new Headers(config.headers);
    this.initialConfig = {signal : this.controller.signal}
    this.request = {
      ...this.initialConfig,
      url : this.url,
      searchParams : this.searchParams,
      headers : this.headers 
    }
    this.interceptors = {
      request: new Set(),
      response: new Set(),
    };

    // Setting interceptors
    this.interceptor = {
      request: {
        use: (callback: PaxiosCallback) => {
          this.interceptors.request.add(callback);
        },
        eject: (callback: PaxiosCallback) => {
          this.interceptors.request.delete(callback);
        },
      },
      response: {
        use: (callback: PaxiosCallback) => {
          this.interceptors.response.add(callback);
        },
        eject: (callback: PaxiosCallback) => {
          this.interceptors.response.delete(callback);
        },
      },
    };
  }

  set config(conf: PaxiosConfig | Partial<PaxiosConfig>) { 
    // imma make this recursive. I'v no time nowadays :'(
    for (const key in conf) {
      if (key === 'headers') {
        for (const k in conf.headers)
          this.headers.set(k, conf[k])
      }
      else if (key === 'url') {

        for (const k in conf.url){
          if (k === 'pathname') 
            this.url = new URL(decodeURIComponent(conf.url.pathname), this.url.origin)
          else if (k === 'searchParams') {
            for (const k in conf.url.searchParams) 
              (this.url.searchParams as any)[k] = conf.url.searchParams[k];
          } else (this.url as any)[k] = conf.url[k];
        };

      } else if (key === 'searchParams') {
        for (const k in conf.searchParams)
          (this.searchParams as any)[k] = conf.searchParams[k];
      }
      else this.initialConfig = Object.assign(this.initialConfig, conf);

    }
    this.searchParams = this.url.searchParams;
    this.request.headers = this.headers;
    this.request.url = this.url;
    this.request.searchParams = this.searchParams;
    this.request = {
      ...this.request,
      ...this.initialConfig,
      headers : this.headers,
      url : this.url,
      searchParams : this.searchParams
    }
  }

  get config() {
    const proxy = Object.assign({}, this.request);
    return new Proxy(proxy, {
      get: (target, prop) => {
        if (prop === 'headers')
          return target.headers
        else if (prop === 'url')
          return target.url
        else if (prop === 'searchParams')
          return target.searchParams
        else return target;
      }
    })
  };

  static create = (config: PaxiosConfig): Paxios => {
    const newInst = new Paxios(config);
    newInst.config = config;
    return newInst;
  };

  cancel(): void {
    this.controller.abort();
  }

  resume(): void {
    this.controller = new AbortController();
  }

  private async apply(): Promise<void> {
    for await (const fn of this.interceptors.request) {
      const newConfig = await fn();
      if (this.interceptors.request.size > 0 && !newConfig)
        throw new PaxiosError('You must return a config object!');
      this.config = newConfig;
    }
  }

  private async handleRequest(config: PaxiosConfig): Promise<PaxiosResponse> {

    try {
      this.config = config;
      const request = new Request(this.request.url.href, this.request);
      await this.apply();
      const response = await fetch(request);
      return response;

    } catch (err) {
      if (err instanceof Error)
        throw new PaxiosError(err.message);
    }
  }

  async get(pathname: string): Promise<PaxiosResponse> {
    return this.handleRequest({ method: 'GET', url: { pathname } });
  }

  async post(pathname: string, body: PaxiosConfig): Promise<PaxiosResponse> {
    return this.handleRequest({
      method: 'POST',
      url: { pathname },
      body: JSON.stringify(body)
    });
  }

  async put(pathname: string, body: PaxiosConfig): Promise<PaxiosResponse> {
    return this.handleRequest({
      method: 'PUT',
      url: { pathname },
      body: JSON.stringify(body)
    });
  }

  async delete(pathname: string, body: PaxiosConfig): Promise<PaxiosResponse> {
    return this.handleRequest({
      method: 'DELETE',
      url: { pathname },
      body: JSON.stringify(body)
    });
  }
}

export default Paxios;