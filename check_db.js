const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:54021/').then(async () => {
  const user = await mongoose.connection.db.collection('users').findOne({email: 'shopowner@test.com'});
  console.log(JSON.stringify(user, null, 2));
  process.exit(0);
}).catch(console.error);
