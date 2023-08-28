import Paxios from "./paxios";

export default Paxios.create({
  credentials : 'omit',
  baseUrl: 'https://jsonplaceholder.typicode.com',
  headers : {
    'content-type' : 'application/json',
    accept : 'application/json',
    'x-requested-with' : 'Paxios v1.0'
  }
})
