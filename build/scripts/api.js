import Paxios from "./paxios.js";

const newInstance = Paxios.create({
    credentials: 'include',
    baseUrl: 'https://jsonplaceholder.typicode.com',
    headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'x-requested-with': 'Paxios v1.0',
        authorization: 'Bearer anExampleToken'
    }
});
export default newInstance;
