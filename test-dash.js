async function run() { 
  for (let i = 0; i < 20; i++) { 
    try { 
      const res = await fetch('http://localhost:3000/client/dashboard'); 
      console.log('Request ' + i + ': ' + res.status); 
    } catch (err) { 
      console.error('Request ' + i + ' failed: ' + err.message); 
    } 
  } 
} 
run();
