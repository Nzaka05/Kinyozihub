const mongoose = require('mongoose');
const uri = "mongodb+srv://nzakagideon05:Galaxyimpact05.@kinyozihub.n47jwog.mongodb.net/?appName=Kinyozihub";

async function testConnection() {
  try {
    await mongoose.connect(uri);
    console.log("SUCCESS: Connected to Atlas MongoDB!");
    process.exit(0);
  } catch (error) {
    console.error("FAILED: Could not connect to Atlas MongoDB.", error.message);
    process.exit(1);
  }
}

testConnection();
