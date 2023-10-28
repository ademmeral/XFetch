type PaxiosInterceptor = (callback: PaxiosCallback) => void;
type PaxiosCallback = (config: PaxiosConfig) => Promise<PaxiosConfig>;

interface PaxiosInterceptorInit {
  request: {
    use: PaxiosInterceptor;
    eject: PaxiosInterceptor;
  };
  response: {
    use: PaxiosInterceptor;
    eject: PaxiosInterceptor;
  };
}

type PaxiosConfig = RequestInit & { [key: string]: any };

interface IPaxiosProps {
  private config: PaxiosConfig;
  private baseUrl: string;
  private controller: AbortController;
  private interceptors: PaxiosInterceptors;
  interceptor: PaxiosInterceptorInit;
}

interface PaxiosInterceptors {
  request: Set<PaxiosCallback>;
  response: Set<PaxiosCallback>;
}
