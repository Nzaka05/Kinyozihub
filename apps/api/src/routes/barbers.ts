import { Router } from 'express';
import { BarberProfile } from '../models/BarberProfile';
import { User } from '../models/User';
import { Service } from '../models/Service';
import { requireAuth } from '../middlewares/requireAuth';
import rateLimit from 'express-rate-limit';
import { Shop } from '../models/Shop';
import { Invite } from '../models/Invite';
import { Review } from '../models/Review';

const router = Router();

const FREE_TIER_BARBER_LIMIT = 3;
const PREMIUM_TIER_BARBER_LIMIT = 10;

const getBarberLimit = (tier: string) => {
  return tier === 'premium' ? PREMIUM_TIER_BARBER_LIMIT : FREE_TIER_BARBER_LIMIT;
};

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

    let shop;
    
    // First, check the new Invite model
    const invite = await Invite.findOne({ code: inviteCode.toUpperCase(), status: 'pending' });
    if (invite) {
      shop = await Shop.findById(invite.shopId);
      if (!shop) return res.status(404).json({ error: 'Associated shop not found.' });
    } else {
      // Fallback to legacy Shop.inviteCode
      shop = await Shop.findOne({ inviteCode: inviteCode.toUpperCase() });
      if (!shop) {
        return res.status(404).json({ error: 'Invalid invite code.' });
      }
    }

    // Check capacity before linking
    const limit = getBarberLimit(shop.subscriptionTier || 'free');
    if (shop.barbers.length >= limit) {
      return res.status(400).json({ error: 'This shop has reached its barber limit.' });
    }

    // Only if capacity check passes: mark invite as accepted
    if (invite) {
      invite.status = 'accepted';
      invite.acceptedBy = userId as any;
      invite.acceptedAt = new Date();
      await invite.save();
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

router.get('/:id/services', async (req, res) => {
  try {
    const { id } = req.params;
    
    let userId = id;
    const profile = await BarberProfile.findOne({ $or: [{ _id: id }, { user: id }] });
    if (profile) {
      userId = profile.user.toString();
    }

    const services = await Service.find({ barber: userId, isActive: true }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      data: services
    });
  } catch (error: any) {
    console.error('Error fetching barber services:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message
    });
  }
});

router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    let userId = id;
    const profile = await BarberProfile.findOne({ $or: [{ _id: id }, { user: id }] });
    if (profile) {
      userId = profile.user.toString();
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ barber: userId })
      .populate('client', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Review.countDocuments({ barber: userId });

    return res.json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
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

    const { bio, specialties, workingHours, payoutMethod, priceRange, area, portfolioImages } = req.body;

    if (bio !== undefined) profile.bio = bio;
    if (specialties !== undefined) profile.specialties = specialties;
    if (workingHours !== undefined) profile.workingHours = workingHours;
    if (priceRange !== undefined) profile.priceRange = priceRange;
    if (area !== undefined) profile.area = area;
    if (portfolioImages !== undefined) profile.portfolioImages = portfolioImages;

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
