require('dotenv').config();
const mongoose = require('mongoose');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kinyozihub');
    
    // Dynamically require models to avoid issues
    const { User } = require('./apps/api/src/models/User');
    const { Shop } = require('./apps/api/src/models/Shop');
    const { BarberProfile } = require('./apps/api/src/models/BarberProfile');
    const { Booking } = require('./apps/api/src/models/Booking');

    let owner = await User.findOne({ email: 'shopowner@test.com' });
    if (!owner) {
      owner = await User.create({
        name: 'David Owner',
        email: 'shopowner@test.com',
        phone: '+254700000001',
        role: 'shop_owner',
      });
    }

    let shop = await Shop.findOne({ ownerId: owner._id });
    if (!shop) {
      shop = await Shop.create({
        ownerId: owner._id,
        name: 'Urban Grooming Hub',
        location: {
          type: 'Point',
          coordinates: [36.8041, -1.2644]
        },
        areaName: 'Westlands',
        subscriptionTier: 'free'
      });
    }

    let emptyOwner = await User.findOne({ email: 'emptyshop@test.com' });
    if (!emptyOwner) {
      emptyOwner = await User.create({
        name: 'Empty Owner',
        email: 'emptyshop@test.com',
        phone: '+254700000002',
        role: 'shop_owner',
      });
    }

    let emptyShop = await Shop.findOne({ ownerId: emptyOwner._id });
    if (!emptyShop) {
      emptyShop = await Shop.create({
        ownerId: emptyOwner._id,
        name: 'Empty Cuts',
        location: {
          type: 'Point',
          coordinates: [36.8167, -1.2833]
        },
        areaName: 'CBD',
        subscriptionTier: 'free'
      });
    }

    const barbers = await BarberProfile.find().limit(2);
    for (const barber of barbers) {
      barber.shopId = shop._id;
      await barber.save();
      
      const client = await User.findOne({ role: 'client' });
      if (client) {
        const today = new Date();
        const startOfToday = new Date(today.setHours(10, 0, 0, 0));
        const laterToday = new Date(today.setHours(14, 0, 0, 0));
        
        await Booking.create({
          client: client._id,
          barber: barber.user,
          service: { name: 'Signature Fade', duration: 45 },
          date: startOfToday,
          status: 'confirmed',
          price: 1500
        });

        await Booking.create({
          client: client._id,
          barber: barber.user,
          service: { name: 'Beard Trim', duration: 30 },
          date: laterToday,
          status: 'completed',
          price: 800
        });
      }
    }

    console.log("Shops seeded successfully!");
  } catch (error) {
    console.error("Detailed error:", error);
  } finally {
    mongoose.disconnect();
  }
};

seed();
