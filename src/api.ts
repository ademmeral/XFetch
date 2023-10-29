import Paxios from "./paxios";

const newInstance = Paxios.create({
  credentials : 'include', // Do not forget to set credentials to include if you'll log in
  baseUrl: 'https://jsonplaceholder.typicode.com',
  headers : {
    'content-type' : 'application/json',
    accept : 'application/json',
    'x-requested-with' : 'Paxios v1.0',
    authorization : 'Bearer anExampleToken'
  }
});

export default newInstance;