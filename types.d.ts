type PaxiosInterceptor = (callback: PaxiosCallback) => void;
type PaxiosCallback = () => Promise<PaxiosConfig> | PaxiosConfig;

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
type PaxiosRequest = Request<ResponseInit>

interface IPaxiosProps {
  initialConfig: PaxiosConfig;
  headers: Headers,
  request?: Request,
  baseUrl: string,
  url: URL,
  controller: AbortController,
  interceptors: PaxiosInterceptors,
  interceptor: PaxiosInterceptorInit,
}

interface PaxiosInterceptors {
  request: Set<PaxiosCallback>;
  response: Set<PaxiosCallback>;
}
