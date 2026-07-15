import { config } from 'dotenv';
config({ path: './apps/api/.env' });
import mongoose from 'mongoose';
import { User } from './apps/api/src/models/User';
import { Shop } from './apps/api/src/models/Shop';
import { BarberProfile } from './apps/api/src/models/BarberProfile';
import { Booking } from './apps/api/src/models/Booking';

async function seedShop() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kinyozihub');
    console.log('Connected to DB');

    // 1. Create a Shop Owner user
    let owner = await User.findOne({ email: 'shopowner@test.com' });
    if (!owner) {
      owner = await User.create({
        name: 'David Owner',
        email: 'shopowner@test.com',
        password: 'Password123',
        role: 'shop_owner',
      });
      console.log('Created owner user');
    }

    // 2. Create a Shop
    let shop = await Shop.findOne({ ownerId: owner._id });
    if (!shop) {
      shop = await Shop.create({
        ownerId: owner._id,
        name: 'Urban Grooming Hub',
        location: {
          address: 'Westlands, Nairobi',
          coordinates: { lat: -1.2644, lng: 36.8041 }
        },
        tier: 'free'
      });
      console.log('Created shop');
    }

    // 3. Link some existing barbers to this shop
    const barbers = await BarberProfile.find().limit(2);
    for (const barber of barbers) {
      barber.shopId = shop._id as any;
      await barber.save();
      console.log(`Linked barber ${barber._id} to shop`);
    }

    // 4. Ensure there is at least one independent barber
    const independentBarber = await BarberProfile.findOne({ shopId: { $exists: false } });
    if (independentBarber) {
      console.log(`Verified independent barber exists: ${independentBarber._id}`);
    } else {
      console.log('No independent barbers left! Creating one just in case.');
      let indepUser = await User.findOne({ email: 'indep@test.com' });
      if (!indepUser) {
        indepUser = await User.create({
          name: 'Independent Barber',
          email: 'indep@test.com',
          password: 'Password123',
          role: 'barber',
        });
      }
      await BarberProfile.create({
        user: indepUser._id,
        shopName: 'Independent Cuts',
        location: {
          address: 'Kilimani, Nairobi',
          coordinates: { lat: -1.2894, lng: 36.7901 }
        },
        services: [],
        rating: 4.8,
        reviewCount: 10
      });
      console.log('Created independent barber');
    }

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedShop();
