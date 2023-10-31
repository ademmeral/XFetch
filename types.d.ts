// types.d.ts
type XFetchinterceptors = {
  request : {
    use : (callback: XFetchCallback) => void,
    eject : (callback: XFetchCallback) => void
  },
  response : {
    use : (callback: XFetchCallback) => void,
    eject : (callback: XFetchCallback) => void
  }
};
type XFetchCallback = () => void | Promise<void>;

interface XFetchInterceptorInit {
  request: {
    use: XFetchInterceptor;
    eject: XFetchInterceptor;
  };
  response: {
    use: XFetchInterceptor;
    eject: XFetchInterceptor;
  };
}

type XFetchConfig = RequestInit<RequestInit<BodyInit>>;
type XFetchResponse = Response<ResponseInit>
type XFetchRequest = Request<ResponseInit>
type XFetchHeaders = Headers
type XFetchURL = URL
type XFetchSearchParams = URLSearchParams
type XFetchController = AbortController
type XFetchURL = URL
type XFetchHeaders = Headers

interface IXFetchProps {
  headers: XFetchHeaders,
  request: XFetchConfig,
  url: XFetchURL,
  controller: XFetchController,
  middlewares: XFetchInterceptors,
  interceptors: XFetchInterceptorInit,
}

interface XFetchMiddlewares {
  request: Set<XFetchCallback>;
  response: Set<XFetchCallback>;
}
