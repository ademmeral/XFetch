import XFetch from "./xfetch";
const xfetchInstance = XFetch.create({
    credentials: 'include',
    baseUrl: 'https://jsonplaceholder.typicode.com',
    headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        authorization: 'Bearer anExampleToken'
    }
});
export default xfetchInstance;
