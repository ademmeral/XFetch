import XFetch from "./xfetch";

const xfetchInstance = XFetch.create({
  credentials : 'include', // Do not forget to set credentials to include if you'll log in
  baseUrl: 'https://jsonplaceholder.typicode.com',
  headers : {
    'content-type' : 'application/json',
    accept : 'application/json',
    authorization : 'Bearer anExampleToken'
  }
});

export default xfetchInstance;