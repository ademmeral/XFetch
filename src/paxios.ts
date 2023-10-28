// paxios.ts

class PaxiosError extends Error {
  public date: Date;

  constructor(message: string) {
    super(message);
    this.name = 'PaxiosError';
    this.message = message;
    this.date = new Date();
  }
}

class Paxios {
  public initialConfig: PaxiosConfig;
  public headers: Headers;
  public controller: AbortController;
  public baseUrl: string;
  private interceptors: PaxiosInterceptors;
  interceptor: PaxiosInterceptorInit;

  constructor(config: PaxiosConfig) {
    this.baseUrl = config.baseUrl;
    this.controller = new AbortController();
    this.initialConfig = Object.defineProperty(
      {},
      'signal', {
      value: this.controller.signal
    }
    );
    this.headers = new Headers(config.headers);
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
    const pickProps = Object.keys(conf)
      .reduce((a: Record<string, any>, c: string) => {
        if (c !== 'headers') a[c] = conf[c]; return a;
      }, {});

    this.initialConfig = Object.assign(this.initialConfig, pickProps);

    if ('headers' in conf)
      for (const key in conf.headers) {
        this.headers.append(key, conf.headers[key])
      };
  }

  get config() {
    return new Proxy(this.initialConfig, {
      get: (target, prop) => {
        if (prop in target) return target[prop]
        else return null;
      }
    })
  };

  static create = (config: PaxiosConfig): Paxios => new Paxios(config);

  cancel(): void {
    this.controller.abort();
  }

  resume(): void {
    this.controller = new AbortController();
  }

  private async apply(config: PaxiosConfig): Promise<void> {
    for await (const fn of this.interceptors.request) {
      const newConfig = await fn(config);
      if (this.interceptors.request.size > 0 && !newConfig)
        throw new PaxiosError('You must return config!');
      this.initialConfig = Object.assign(this.initialConfig, newConfig);
      this.headers = new Headers(Object.assign(this.headers, config.headers));
    }
  }

  private setRequest(config: PaxiosConfig): PaxiosRequest {

    const requestInit = Object.defineProperty(
      Object.assign(this.initialConfig, config),
      'headers', {
      value: Object.assign(this.headers),
      writable: false
    }
    );
    const request = new Request(
      this.baseUrl + config.path,
      requestInit
    )
    return request;
  }

  private async request(config: PaxiosConfig): Promise<PaxiosResponse> {

    try {
      await this.apply(config);
      const resp = await fetch(this.setRequest(config));
      return resp;
    } catch (err) {
      if (err instanceof Error)
        throw new PaxiosError(err.message);
    }
  }

  async get(path: string): Promise<PaxiosResponse> {
    return this.request({ method: 'GET', path });
  }

  async post(path: string, body: PaxiosConfig): Promise<PaxiosResponse> {
    return this.request({
      method: 'POST',
      path,
      body: JSON.stringify(body)
    });
  }

  async put(path: string, body: PaxiosConfig): Promise<PaxiosResponse> {
    return this.request({
      method: 'PUT',
      path,
      body: JSON.stringify(body)
    });
  }

  async delete(path: string, body: PaxiosConfig): Promise<PaxiosResponse> {
    return this.request({
      method: 'DELETE',
      path,
      body: JSON.stringify(body)
    });
  }
}

export default Paxios;