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

class Paxios  {
  private config: PaxiosConfig;
  private baseUrl: string;
  private controller: AbortController;
  private interceptors: PaxiosInterceptors;
  interceptor: PaxiosInterceptorInit;

  constructor(config: PaxiosConfig) {
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

  static create = (config: PaxiosConfig): Paxios => new Paxios(config);

  cancel():void {
    this.controller.abort();
    this.config = {
      ...this.config,
      signal: this.controller.signal,
    };
  }

  resume():void {
    this.controller = new AbortController();
    this.config = {
      ...this.config,
      signal: this.controller.signal,
    };
  }

  private async apply(config: PaxiosConfig): Promise<void> {
    for await (const fn of this.interceptors.request) {
      const newConfig = await fn(config);
      if (this.interceptors.request.size > 0 && !newConfig)
        throw new PaxiosError('You must return config!');
      this.config = {
        ...this.config,
        ...newConfig,
        headers: { ...this.config.headers, ...newConfig.headers },
      };
    }
  }

  private async request(config: PaxiosConfig): Promise<Response> {
      await this.apply(config);
      const resp =  await fetch(config.url, config);
      if (!resp.ok) throw new PaxiosError(
        'An error has occured while fetching data.'
      );
      return resp;
  }

  async get(path: string, conf?: PaxiosConfig): Promise<Response> {
    
    return this.request({
      ...this.config,
      ...conf,
      method: 'GET',
      url: this.baseUrl + path,
    });
  }

  async post(path: string, conf: PaxiosConfig): Promise<Response> {
    return this.request({
      ...this.config,
      ...conf,
      method: 'POST',
      url: this.baseUrl + path,
      body: JSON.stringify(conf.body),
    });
  }

  async put(path: string, conf: PaxiosConfig): Promise<Response> {
    return this.request({
      ...this.config,
      ...conf,
      method: 'PUT',
      url: this.baseUrl + path,
      body: JSON.stringify(conf.body),
    });
  }

  async delete(path: string, conf: PaxiosConfig): Promise<Response> {
    return this.request({
      ...this.config,
      ...conf,
      method: 'DELETE',
      url: this.baseUrl + path,
    });
  }
}

export default Paxios;