const fs = require('fs');
const p = fs.readFileSync('./tmp/propose_time.html', 'utf8');
console.log('Original request HTML:', p.substring(p.indexOf('Original request') - 100, p.indexOf('Original request') + 100));
const a = fs.readFileSync('./tmp/reschedule_accept.html', 'utf8');
const search = 'The appointment isn';
console.log('Info Icon HTML:', a.substring(a.indexOf(search) - 100, a.indexOf(search) + 100));
