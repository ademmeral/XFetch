import Paxios from './api.js';
const intercept = async (conf) => {
    try {
        const resp = await fetch('https://jsonplaceholder.typicode.com/users/3');
        const data = await resp.json();
        console.log('I am an interceptor. Here is you Data', data);
    }
    catch (err) {
        console.log(err);
    }
};
const btns = [...document.querySelectorAll('button')];
btns[0].addEventListener('click', async () => {
    try {
        const resp = await Paxios.get('/todos/1');
        const data = await resp.json();
        console.log(data);
    }
    catch (err) {
        console.log(err);
    }
});
btns[1].addEventListener('click', () => {
    Paxios.interceptor.request.eject(intercept);
});
btns[2].addEventListener('click', () => {
    Paxios.interceptor.request.use(intercept);
});
