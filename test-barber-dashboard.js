/**
 * End-to-end API verification for the Barber Dashboard.
 * 
 * Steps:
 * 1. Login as barber (+254700000000) via OTP
 * 2. Seed bookings + barber profiles
 * 3. Fetch bookings — confirm pending ones exist
 * 4. Decline a pending booking via PATCH
 * 5. Re-fetch bookings — confirm the declined booking is now 'cancelled'
 * 6. Attempt double-decline (should fail)
 * 7. Fetch /barbers/me — confirm profile data returns with tier
 */

const BASE = 'http://localhost:3001/api';

async function run() {
  console.log('=== Barber Dashboard API Verification ===\n');

  // Step 1: Request OTP
  console.log('1. Requesting OTP for barber phone...');
  let res = await fetch(`${BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+254700000000' })
  });
  let data = await res.json();
  console.log(`   Status: ${res.status}, Response:`, data);

  // Step 2: Verify OTP
  console.log('\n2. Verifying OTP...');
  res = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+254700000000', code: '1234' })
  });
  data = await res.json();
  console.log(`   Status: ${res.status}, isNewUser: ${data.isNewUser}`);

  if (data.isNewUser) {
    console.log('   User is new — registering as barber...');
    res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.registrationToken}`
      },
      body: JSON.stringify({ name: 'John Barber', role: 'barber' })
    });
    data = await res.json();
    console.log(`   Registered: ${data.user?.name} (${data.user?.role})`);
  }

  const token = data.accessToken;
  const user = data.user;
  console.log(`   ✅ Logged in as: ${user.name} (role: ${user.role})`);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Step 3: Seed bookings
  console.log('\n3. Seeding bookings...');
  res = await fetch(`${BASE}/bookings/seed`, { method: 'POST', headers: authHeaders });
  data = await res.json();
  console.log(`   Status: ${res.status}, Message: ${data.message}`);

  // Step 3b: Seed barber profiles  
  console.log('\n3b. Seeding barber profiles...');
  res = await fetch(`${BASE}/barbers/seed`, { method: 'POST', headers: authHeaders });
  data = await res.json();
  console.log(`   Status: ${res.status}, Message: ${data.message}`);

  // Step 4: Fetch bookings
  console.log('\n4. Fetching bookings...');
  res = await fetch(`${BASE}/bookings`, { headers: authHeaders });
  data = await res.json();
  const bookings = data.data;
  console.log(`   Total bookings: ${bookings.length}`);
  bookings.forEach(b => {
    console.log(`   - [${b.status.toUpperCase()}] ${b.serviceName} @ ${b.timeSlot} (id: ${b._id})`);
  });

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  console.log(`   Pending bookings: ${pendingBookings.length}`);

  if (pendingBookings.length === 0) {
    console.log('   ⚠ No pending bookings to test Accept/Decline.');
  } else {
    // Step 5: Decline the first pending booking
    const toDecline = pendingBookings[0];
    console.log(`\n5. Declining booking "${toDecline.serviceName}" (${toDecline._id})...`);
    res = await fetch(`${BASE}/bookings/${toDecline._id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'cancelled' })
    });
    data = await res.json();
    console.log(`   Status: ${res.status}, New booking status: ${data.data?.status}, cancelledBy: ${data.data?.cancelledBy}`);

    if (data.data?.status === 'cancelled' && data.data?.cancelledBy === 'barber') {
      console.log('   ✅ Decline worked — status=cancelled, cancelledBy=barber');
    } else {
      console.log('   ❌ Decline FAILED — unexpected response');
    }

    // Step 6: Re-fetch to verify persistence
    console.log('\n6. Re-fetching bookings to verify persistence...');
    res = await fetch(`${BASE}/bookings`, { headers: authHeaders });
    data = await res.json();
    const declinedBooking = data.data.find(b => b._id === toDecline._id);
    console.log(`   Declined booking status in DB: ${declinedBooking?.status}`);
    
    if (declinedBooking?.status === 'cancelled') {
      console.log('   ✅ Persistence confirmed — decline persisted after re-fetch');
    } else {
      console.log('   ❌ Persistence FAILED');
    }

    // Step 7: Double-decline (should fail)
    console.log('\n7. Attempting double-decline (should fail)...');
    res = await fetch(`${BASE}/bookings/${toDecline._id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'cancelled' })
    });
    data = await res.json();
    console.log(`   Status: ${res.status}, Error: ${data.error || 'none'}`);
    if (res.status === 400) {
      console.log('   ✅ Correctly rejected — only pending bookings can be updated');
    } else {
      console.log('   ❌ Should have been rejected');
    }
  }

  // Step 8: Fetch barber profile
  console.log('\n8. Fetching barber profile via /barbers/me...');
  res = await fetch(`${BASE}/barbers/me`, { headers: authHeaders });
  data = await res.json();
  console.log(`   Status: ${res.status}, Success: ${data.success}`);
  if (data.success && data.data) {
    const p = data.data;
    console.log(`   Shop: ${p.shopName}`);
    console.log(`   Tier: ${p.tier}, Commission: ${p.commissionRate}%`);
    console.log(`   Rating: ${p.rating} (${p.reviewCount} reviews)`);
    console.log('   ✅ Barber profile endpoint working');
  } else {
    console.log(`   Response:`, JSON.stringify(data));
    console.log('   ❌ Barber profile NOT found');
  }

  console.log('\n=== Verification Complete ===');
}

run().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
