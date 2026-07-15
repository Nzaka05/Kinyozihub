async function run() { 
  for (let i = 0; i < 20; i++) { 
    try { 
      const res = await fetch('http://localhost:3000/client/dashboard', { 
        headers: { 
          'RSC': '1', 
          'Next-Router-State-Tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22(auth)%22%2C%7B%22children%22%3A%5B%22login%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%5D%7D%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D' 
        } 
      }); 
      console.log('Request ' + i + ': ' + res.status); 
    } catch (err) { 
      console.error('Request ' + i + ' failed: ' + err.message); 
    } 
  } 
} 
run();
