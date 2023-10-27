import Paxios from './api';
// DONT FORGET TO ADD .JS EXTENSION TO THE END OF THE JAVASCRIPT FILES IN BUILD/SCRIPTS DIRECTORY
const intercept = async (conf?:Record<string, any>) => {
  /* try {
    
    const resp = await fetch('https://jsonplaceholder.typicode.com/users/3')
    const data = await resp.json()
    console.log('I am an interceptor. Here is you Data', data);
  } catch (err) {
    console.log(err);

  } */
  console.log('Im an interceptor/middleware and setting new token')
  return {
    ...conf, 
    headers : {
      'authorization' : 'Bearer myVeryPrivateToken'
    }
  }
};

const btns = [...document.querySelectorAll('button')] as HTMLButtonElement[]
btns[0].addEventListener('click', async () => {
  try{
    const resp = await Paxios.get('/todos/1')
    const data = await resp?.json();
    console.log(data)
  } catch (err) {
    console.log(err)
  }
})
btns[1].addEventListener('click', () => {
  Paxios.interceptor.request.eject(intercept)
})
btns[2].addEventListener('click', () => {
  Paxios.interceptor.request.use(intercept);
})  