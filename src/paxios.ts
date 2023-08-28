
export type PaxiosProps = {
  [key: string]: any;
};
export type PaxiosCallback = (config: PaxiosProps) => void
interface IPaxiosInterceptor {
  request: {
    use: (fn: PaxiosCallback) => void,
    eject: (fn: PaxiosCallback) => void
  },
  response: {
    use: (config: PaxiosCallback) => void,
    eject: (fn: PaxiosCallback) => void
  }
}
export type PaxiosInterceptors = {
  request: Set<PaxiosCallback>,
  response: Set<PaxiosCallback>,
}

class Paxios {
  private config: PaxiosProps;
  private baseUrl: string;
  private controller: AbortController;
  private interceptors: PaxiosInterceptors;
  interceptor: IPaxiosInterceptor;
  // constructor
  constructor(config: Record<string, any>) {
    this.baseUrl = config.baseUrl;  // base_url
    this.controller = new AbortController() // controller
    this.config = { // config
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
        use: (callback: PaxiosCallback) => {
          this.interceptors.request.add(callback)
        },
        eject: (fn: PaxiosCallback) => {
          this.interceptors.request.delete(fn)
        }
      },
      response: {
        use: (callback: PaxiosCallback) => {
          this.interceptors.request.add(callback)
        },
        eject: (callback: PaxiosCallback) => {
          this.interceptors.request.delete(callback)
        }
      }
    }
  }
  // new instance
  static create = (config: Record<string, any> = {}) => new Paxios(config);

  // cancellation
  cancel() {
    this.controller.abort()
    this.config = {
      ...this.config,
      signal: this.controller.signal
    }
  }
  // resumption
  resume() {
    this.controller = new AbortController()
    this.config = {
      ...this.config,
      signal: this.controller.signal
    }
  }

  private async apply(config: PaxiosProps) {
    for (const fn of this.interceptors.request) { fn(config) };
    return config
  }
  // request
  private async request(config: PaxiosProps) {
    await this.apply(config);
    const resp = await fetch(config.url, config);
    if (resp.ok) return resp;
    throw new Error('An error has occured while fetching. Plase try again!');
  }
  // methods
  async get(path: string, conf?: Record<string, any>) {
    return await this.request({
      ...this.config,
      ...conf,
      method: 'GET',
      url: this.baseUrl + path
    })
  }
  async post(path: string, conf: Record<string, any>) {

    return await this.request({
      ...this.config,
      ...conf,
      headers : {
        'Content-Type' : 'application/json',
        ...conf.headers
      },
      method: 'POST',
      url: this.baseUrl + path,
      body: JSON.stringify({ ...conf.body })
    })
  }
  async put(path: string, conf: Record<string, any>) {

    return await this.request({
      ...this.config,
      ...conf,
      headers : {
        'Content-Type' : 'application/json',
        ...conf.headers
      },
      method: 'PUT',
      url: this.baseUrl + path,
      body: JSON.stringify({ ...conf.body })
    })
  }
  async delete(path: string, conf: PaxiosProps) {

    return await this.request({
      ...this.config,
      ...conf,
      method: 'DELETE',
      url: this.baseUrl + path
    })
  }
}

export default Paxios
