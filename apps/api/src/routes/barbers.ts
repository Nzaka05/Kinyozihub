import { Router } from 'express';
import { BarberProfile } from '../models/BarberProfile';
import { User } from '../models/User';
import { requireAuth } from '../middlewares/requireAuth';
import rateLimit from 'express-rate-limit';

const router = Router();

// POST /api/barbers/seed - Seed dummy barbers
router.post('/seed', requireAuth, async (req, res) => {
  try {
    // Check if barbers already exist
    const count = await BarberProfile.countDocuments();
    if (count > 0) {
      return res.json({ success: true, message: 'Barbers already seeded' });
    }

    // Create dummy barber users
    const barberUsers = await Promise.all([
      User.findOneAndUpdate({ phone: '+254700000001' }, { name: 'Maina', role: 'barber' }, { upsert: true, new: true }),
      User.findOneAndUpdate({ phone: '+254700000002' }, { name: 'Odhiambo', role: 'barber' }, { upsert: true, new: true }),
      User.findOneAndUpdate({ phone: '+254700000003' }, { name: 'Kamau', role: 'barber' }, { upsert: true, new: true }),
    ]);

    const profilesToInsert = [
      {
        user: barberUsers[0]._id,
        shopName: "Maina's Grooming Parlor",
        isVerified: true,
        rating: 4.8,
        reviewCount: 124,
        priceRange: "KES 500 - 1500",
        distanceString: "1.2 km",
        nextAvailable: "Today 3:00 PM",
        profileImage: "https://i.pravatar.cc/400?img=11",
        isSponsored: true,
        portfolioImages: [
          "https://i.pravatar.cc/400?img=21",
          "https://i.pravatar.cc/400?img=22",
          "https://i.pravatar.cc/400?img=23"
        ]
      },
      {
        user: barberUsers[1]._id,
        shopName: "Odhiambo's Executive Cuts",
        isVerified: true,
        rating: 4.9,
        reviewCount: 89,
        priceRange: "KES 800 - 2000",
        distanceString: "2.5 km",
        nextAvailable: "Today 1:00 PM",
        profileImage: "https://i.pravatar.cc/400?img=12",
        isSponsored: false,
        portfolioImages: [
          "https://i.pravatar.cc/400?img=24",
          "https://i.pravatar.cc/400?img=25",
          "https://i.pravatar.cc/400?img=26"
        ]
      },
      {
        user: barberUsers[2]._id,
        shopName: "Kamau's Fresh Fades",
        isVerified: false,
        rating: 4.5,
        reviewCount: 42,
        priceRange: "KES 300 - 1000",
        distanceString: "0.8 km",
        nextAvailable: "Tomorrow 10:00 AM",
        profileImage: "https://i.pravatar.cc/400?img=13",
        isSponsored: false,
        portfolioImages: [
          "https://i.pravatar.cc/400?img=27",
          "https://i.pravatar.cc/400?img=28",
          "https://i.pravatar.cc/400?img=29"
        ]
      }
    ];

    // If the logged-in user is a barber, also seed their own profile
    const currentUserId = req.user?.id;
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId);
      if (currentUser?.role === 'barber') {
        const alreadyInList = barberUsers.some(bu => bu._id.toString() === currentUserId);
        if (!alreadyInList) {
          profilesToInsert.push({
            user: currentUserId,
            shopName: `${currentUser.name}'s Barbershop`,
            isVerified: true,
            rating: 4.7,
            reviewCount: 56,
            priceRange: "KES 500 - 2000",
            distanceString: "0 km",
            nextAvailable: "Now",
            profileImage: "https://i.pravatar.cc/400?img=14",
            isSponsored: false,
            portfolioImages: [
              "https://i.pravatar.cc/400?img=31",
              "https://i.pravatar.cc/400?img=32",
              "https://i.pravatar.cc/400?img=33"
            ]
          });
        }
      }
    }

    await BarberProfile.insertMany(profilesToInsert);

    return res.json({
      success: true,
      message: 'Barbers seeded successfully'
    });
  } catch (error: any) {
    console.error('Error seeding barbers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to seed barbers',
      error: error.message
    });
  }
});

// GET /api/barbers - List all seeded barbers
router.get('/', async (req, res) => {
  try {
    const barbers = await BarberProfile.find().populate('user', 'name phone role');
    return res.json({
      success: true,
      message: 'Barbers fetched successfully',
      data: barbers
    });
  } catch (error: any) {
    console.error('Error fetching barbers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch barbers',
      error: error.message
    });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const profile = await BarberProfile.findOne({ user: userId }).populate('user', 'name phone role');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Barber profile not found' });
    }

    return res.json({
      success: true,
      data: profile
    });
  } catch (error: any) {
    console.error('Error fetching barber profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch barber profile',
      error: error.message
    });
  }
});

const joinShopLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 join attempts per windowMs
  message: { error: "Too many join attempts from this IP, please try again after 15 minutes." }
});

router.post('/me/join-shop', requireAuth, joinShopLimiter, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { inviteCode } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!inviteCode) return res.status(400).json({ error: 'Invite code is required' });

    const profile = await BarberProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({ error: 'Barber profile not found' });
    }

    if (profile.shopId) {
      return res.status(400).json({ error: 'You are already linked to a shop. Contact support or leave your current shop first to switch.' });
    }

    // Must import Shop model. Let's do it inline to avoid messing with top imports if it's not there,
    // wait, I can just require it or better, I will just add the import at the top later. 
    // I will use mongoose.model('Shop') for now to be safe.
    const mongoose = require('mongoose');
    const Shop = mongoose.model('Shop');

    const shop = await Shop.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!shop) {
      return res.status(404).json({ error: 'Invalid invite code.' });
    }

    profile.shopId = shop._id;
    await profile.save();

    // Add barber to shop's barbers array (if it's not there)
    if (!shop.barbers.includes(profile._id)) {
      shop.barbers.push(profile._id);
      await shop.save();
    }

    return res.json({ success: true, message: 'Successfully joined shop', shopId: shop._id });

  } catch (error: any) {
    console.error('Error joining shop:', error);
    return res.status(500).json({ error: 'Failed to join shop' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // We can query either by the BarberProfile's own _id or the underlying user's _id.
    // Dashboard passes the user._id or barber._id. Let's try both just in case.
    const query = { $or: [{ _id: id }, { user: id }] };
    
    // Explicitly select only public fields from User to avoid leaking passwords/auth
    const profile = await BarberProfile.findOne(query)
      .populate('user', 'name profileImage rating reviewCount shopName isVerified');
      
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Barber profile not found' });
    }

    return res.json({
      success: true,
      data: profile
    });
  } catch (error: any) {
    console.error('Error fetching barber profile by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch barber profile',
      error: error.message
    });
  }
});

router.put('/me/settings', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const profile = await BarberProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({ error: 'Barber profile not found' });
    }

    const { bio, specialties, workingHours, payoutMethod, priceRange } = req.body;

    if (bio !== undefined) profile.bio = bio;
    if (specialties !== undefined) profile.specialties = specialties;
    if (workingHours !== undefined) profile.workingHours = workingHours;
    if (priceRange !== undefined) profile.priceRange = priceRange;

    // If payoutMethod changes, mark it as unverified
    if (payoutMethod !== undefined && profile.payoutMethod !== payoutMethod) {
      profile.payoutMethod = payoutMethod;
      profile.payoutMethodVerified = false;
    }

    await profile.save();

    return res.json({ success: true, data: profile });
  } catch (error: any) {
    console.error('Error updating barber settings:', error);
    res.status(500).json({ error: 'Failed to update barber settings' });
  }
});

export const barbersRouter = router;
