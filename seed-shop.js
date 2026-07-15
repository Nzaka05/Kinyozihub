require('dotenv').config({ path: './apps/api/.env' });
const mongoose = require('mongoose');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kinyozihub');
    console.log('Connected to DB');
    const db = mongoose.connection.db;

    // Password123 hashed (from other seed scripts or just a dummy hash if auth allows it).
    // Wait, the API login requires a proper bcrypt hash. 
    // Let's use bcryptjs to hash 'Password123' just in case.
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Password123', 10);

    // 1. Create a Shop Owner user (Populated Shop)
    let owner = await db.collection('users').findOne({ email: 'shopowner@test.com' });
    if (!owner) {
      const result = await db.collection('users').insertOne({
        name: 'David Owner',
        email: 'shopowner@test.com',
        password: hashedPassword,
        role: 'shop_owner',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      owner = { _id: result.insertedId };
      console.log('Created owner user');
    }

    // 2. Create a Populated Shop
    let shop = await db.collection('shops').findOne({ ownerId: owner._id });
    if (!shop) {
      const result = await db.collection('shops').insertOne({
        ownerId: owner._id,
        name: 'Urban Grooming Hub',
        location: {
          address: 'Westlands, Nairobi',
          coordinates: { lat: -1.2644, lng: 36.8041 }
        },
        tier: 'free',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      shop = { _id: result.insertedId };
      console.log('Created shop');
    }

    // 3. Create an Empty Shop Owner user (Empty Shop)
    let emptyOwner = await db.collection('users').findOne({ email: 'emptyshop@test.com' });
    if (!emptyOwner) {
      const result = await db.collection('users').insertOne({
        name: 'Empty Owner',
        email: 'emptyshop@test.com',
        password: hashedPassword,
        role: 'shop_owner',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      emptyOwner = { _id: result.insertedId };
      console.log('Created empty owner user');
    }

    // 4. Create an Empty Shop
    let emptyShop = await db.collection('shops').findOne({ ownerId: emptyOwner._id });
    if (!emptyShop) {
      const result = await db.collection('shops').insertOne({
        ownerId: emptyOwner._id,
        name: 'Empty Cuts',
        location: {
          address: 'CBD, Nairobi',
          coordinates: { lat: -1.2833, lng: 36.8167 }
        },
        tier: 'free',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      emptyShop = { _id: result.insertedId };
      console.log('Created empty shop');
    }

    // 5. Ensure at least two barbers exist and link them to the populated shop
    const barbers = await db.collection('barberprofiles').find({}).limit(2).toArray();
    if (barbers.length < 2) {
      console.log('Not enough barbers found to link to shop!');
    } else {
      for (const barber of barbers) {
        await db.collection('barberprofiles').updateOne(
          { _id: barber._id },
          { $set: { shopId: shop._id } }
        );
        console.log(`Linked barber ${barber._id} to populated shop`);

        // Create some bookings for this barber for today
        const client = await db.collection('users').findOne({ role: 'client' });
        if (client) {
          const today = new Date();
          const startOfToday = new Date(today.setHours(10, 0, 0, 0)); // 10 AM
          const laterToday = new Date(today.setHours(14, 0, 0, 0)); // 2 PM

          await db.collection('bookings').insertOne({
            client: client._id,
            barber: barber.user, // barber.user holds the User ref
            service: { name: 'Signature Fade', duration: 45 },
            date: startOfToday,
            status: 'confirmed',
            price: 1500,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          await db.collection('bookings').insertOne({
            client: client._id,
            barber: barber.user,
            service: { name: 'Beard Trim', duration: 30 },
            date: laterToday,
            status: 'completed',
            price: 800,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log(`Created bookings for barber ${barber._id}`);
        }
      }
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
}

seed();
