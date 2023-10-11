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

  private async apply(config: PaxiosConfig): Promise<PaxiosConfig> {
    for (const fn of this.interceptors.request) {
      fn(config);
    }
    return config;
  }

  private async request(config: PaxiosConfig): Promise<Response> {
    try {
      await this.apply(config);
      return await fetch(config.url, config);
    } catch (err) {
      if (err instanceof Error) throw new PaxiosError(err.message);
      throw new PaxiosError('An error occurred during the request');
    }
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