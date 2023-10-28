type PaxiosInterceptor = (callback: PaxiosCallback) => void;
type PaxiosCallback = (config: PaxiosConfig) => Promise<PaxiosConfig>|PaxiosConfig;

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

type PaxiosConfig = RequestInit<RequestInit<BodyInit>>;
type PaxiosResponse = Response<ResponseInit>

interface IPaxiosProps {
  public initialConfig: PaxiosConfig;
  public headers : Headers,
  public request? : Request, 
  private baseUrl: string,
  private controller: AbortController,
  private interceptors: PaxiosInterceptors,
  interceptor: PaxiosInterceptorInit,
}

interface PaxiosInterceptors {
  request: Set<PaxiosCallback>;
  response: Set<PaxiosCallback>;
}
