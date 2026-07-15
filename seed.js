const axios = require('axios');

async function seedUser() {
  try {
    const phone = "+254712345678";
    let accessToken;
    
    // 1. Send OTP
    await axios.post('http://localhost:3001/api/auth/send-otp', { phone });
    console.log("OTP sent.");

    // 2. Verify OTP
    const verifyRes = await axios.post('http://localhost:3001/api/auth/verify-otp', { phone, code: "1234" });
    
    if (verifyRes.data.isNewUser) {
      const registrationToken = verifyRes.data.registrationToken;
      console.log("OTP verified. Registering...");

      // 3. Register User
      const regRes = await axios.post('http://localhost:3001/api/auth/register', {
        name: "Test User",
        role: "client"
      }, {
        headers: {
          Authorization: `Bearer ${registrationToken}`
        }
      });
      console.log("User successfully seeded.");
      accessToken = regRes.data.accessToken;
    } else {
      console.log("User already exists. Logged in.");
      accessToken = verifyRes.data.accessToken;
    }

    // 4. Seed Barbers
    const seedBarbersRes = await axios.post('http://localhost:3001/api/barbers/seed');
    console.log(seedBarbersRes.data.message);

    // 5. Seed Bookings
    if (accessToken) {
      const seedBookingsRes = await axios.post('http://localhost:3001/api/bookings/seed', {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      console.log(seedBookingsRes.data.message);
    }
  } catch (error) {
    console.error("Failed to seed:", error.response?.data || error.message);
  }
}

seedUser();
