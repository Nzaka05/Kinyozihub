import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

async function seedDatabase() {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.error("Database connection not ready for seeding");
      return;
    }
    const hashedPassword = await bcrypt.hash('Password123', 10);

    // 1. Shop Owner
    let owner = await db.collection('users').findOne({ email: 'shopowner@test.com' });
    if (!owner) {
      const result = await db.collection('users').insertOne({
        name: 'David Owner',
        email: 'shopowner@test.com',
        phone: '1234567890',
        password: hashedPassword,
        role: 'shop_owner',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      owner = { _id: result.insertedId };
      console.log('Created owner user');
    }

    // 2. Shop
    let shop = await db.collection('shops').findOne({ ownerId: owner._id });
    if (!shop) {
      const result = await db.collection('shops').insertOne({
        ownerId: owner._id,
        name: 'Urban Grooming Hub',
        areaName: 'Westlands, Nairobi',
        location: {
          type: 'Point',
          coordinates: [36.8041, -1.2644]
        },
        subscriptionTier: 'free',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      shop = { _id: result.insertedId };
      console.log('Created shop');
    }

    // 3. Client
    let client = await db.collection('users').findOne({ email: 'client@test.com' });
    if (!client) {
      const result = await db.collection('users').insertOne({
        name: 'Client User',
        email: 'client@test.com',
        phone: '0987654321',
        password: hashedPassword,
        role: 'client',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      client = { _id: result.insertedId };
      console.log('Created client user');
    }

    // 4. Barber Profile (needs to be associated with a user to work fully in bookings)
    let barberUser = await db.collection('users').findOne({ email: 'barber@test.com' });
    if (!barberUser) {
      const result = await db.collection('users').insertOne({
        name: 'John Barber',
        email: 'barber@test.com',
        phone: '1122334455',
        password: hashedPassword,
        role: 'barber',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      barberUser = { _id: result.insertedId };
      console.log('Created barber user');
    }
    
    let barberProfile = await db.collection('barberprofiles').findOne({ user: barberUser._id });
    if (!barberProfile) {
      const result = await db.collection('barberprofiles').insertOne({
        user: barberUser._id,
        shopId: shop._id,
        specialties: ['Fade', 'Beard Trim'],
        rating: 4.8,
        reviewCount: 42,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      barberProfile = { _id: result.insertedId, user: barberUser._id };
      console.log('Created barber profile and linked to shop');
    }

    // 5. Bookings
    const bookingsCount = await db.collection('bookings').countDocuments({ shopId: shop._id });
    if (bookingsCount === 0) {
      const today = new Date();
      const startOfToday = new Date(today.setHours(10, 0, 0, 0));
      const laterToday = new Date(today.setHours(14, 0, 0, 0));

      await db.collection('bookings').insertOne({
        shopId: shop._id,
        client: client._id,
        barber: barberProfile.user,
        service: { name: 'Signature Fade', duration: 45 },
        date: startOfToday,
        status: 'confirmed',
        price: 1500,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await db.collection('bookings').insertOne({
        shopId: shop._id,
        client: client._id,
        barber: barberProfile.user,
        service: { name: 'Beard Trim', duration: 30 },
        date: laterToday,
        status: 'completed',
        price: 800,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Created bookings for shop`);
    }

    console.log('In-memory Database seeded successfully.');
  } catch (err) {
    console.error('Failed to seed DB:', err);
  }
}

export async function connectDB() {
  let uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.warn("WARNING: MONGODB_URI environment variable is missing. Spinning up mongodb-memory-server for local dev/testing. DO NOT USE IN PRODUCTION!");
    mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
  }

  try {
    await mongoose.connect(uri);
    console.log(`Connected to MongoDB successfully (${process.env.MONGODB_URI ? 'Atlas/Local' : 'Memory Server'})`);
    if (!process.env.MONGODB_URI) {
      await seedDatabase();
    }
  } catch (err) {
    console.error("FATAL ERROR: Failed to connect to MongoDB.", err);
    process.exit(1);
  }
}
