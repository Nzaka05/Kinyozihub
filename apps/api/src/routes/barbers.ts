import { Router } from 'express';
import { BarberProfile } from '../models/BarberProfile';
import { User } from '../models/User';
import { requireAuth } from '../middlewares/requireAuth';

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

export const barbersRouter = router;
