import XFetch from './api';
// DONT FORGET TO ADD .JS EXTENSION TO THE END OF THE JAVASCRIPT FILES IN BUILD/SCRIPTS DIRECTORY
const intercept = async () => {
    /* try {
      // (!) DO NOT USE THE SAME INSTANCE IN AN INTERCEPTOR INSTEAD USE FETCH OR CREATE NEW ONE
      const resp = await fetch('https://jsonplaceholder.typicode.com/users/3')
      const data = await resp.json()
      console.log('I am an interceptor. Here is you Data', data);
    } catch (err) {
      console.log(err);
    } */
    console.log('Im an XFetch interceptor before request x()');
};
const btns = [...document.querySelectorAll('button')];
btns[0].addEventListener('click', async () => {
    try {
        const resp = await XFetch.get('/todos/1');
        const data = await resp?.json();
        console.log(data);
    }
    catch (err) {
        console.log(err);
    }
});
btns[1].addEventListener('click', () => {
    XFetch.interceptors.request.eject(intercept);
});
btns[2].addEventListener('click', () => {
    XFetch.interceptors.request.use(intercept);
});
btns[3].addEventListener('click', () => {
    XFetch.cancel();
});
btns[4].addEventListener('click', () => {
    XFetch.resume();
});
btns[5].addEventListener('click', async () => {
    const result = await XFetch.getAll(['/posts/1', '/users/2', '/comments/3']);
    // const result = await resp.json();
    console.log(result);
    // .then(result => result.json())
    // .then(console.log)
    // .catch(console.error)
});
/* ========== PROGRESS =============== */
const handleProgress = ({ chunks, chunksLength, totalLength }) => {
    const calcInPerc = (chunksLength / totalLength) * 100;
    console.log(`${calcInPerc}% completed...`); // !! Jsonplaceholder doesnt give info about content-length
};
btns[6].addEventListener('click', () => {
    XFetch.getFileWithProgress('/comments', handleProgress);
});
