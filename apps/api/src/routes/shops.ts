import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { Shop } from "../models/Shop";
import { BarberProfile } from "../models/BarberProfile";
import { Booking } from "../models/Booking";
import { User } from "../models/User";
export const shopsRouter = Router();

shopsRouter.post("/seed", async (req, res) => {
  try {
    let owner = await User.findOne({ phone: '+254700000001' });
    if (!owner) {
      owner = await User.create({
        name: 'David Owner',
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

    let emptyOwner = await User.findOne({ phone: '+254700000002' });
    if (!emptyOwner) {
      emptyOwner = await User.create({
        name: 'Empty Owner',
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

    res.json({ message: "Shops seeded successfully!" });
  } catch (error) {
    console.error("Failed to seed shops:", error);
    res.status(500).json({ error: "Failed to seed shops" });
  }
});

shopsRouter.use(requireAuth);

shopsRouter.get("/me/dashboard", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { User } = require("../models/User");
    const user = await User.findById(userId);

    if (user?.role !== "shop_owner") {
      return res.status(403).json({ error: "Forbidden: Not a shop owner" });
    }

    const shop = await Shop.findOne({ ownerId: userId });
    
    if (!shop) {
      // Return empty structure if shop doesn't exist yet
      return res.json({
        success: true,
        data: {
          shop: null,
          barbersOverview: [],
          combinedBookings: [],
          stats: {
            todayBookings: 0,
            weeklyEarnings: 0,
            activeBarbers: 0,
          }
        }
      });
    }

    // Find barbers in this shop
    const barberProfiles = await BarberProfile.find({ shopId: shop._id }).populate("user", "name profileImage");
    
    const barberUserIds = barberProfiles.map(bp => bp.user._id);

    // Date range for "Today"
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Date range for "This Week" (assuming rolling 7 days or start of week)
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    // Fetch bookings for these barbers
    const allBookings = await Booking.find({
      barber: { $in: barberUserIds },
      date: { $gte: startOfWeek }
    }).populate("client", "name profileImage").populate("barber", "name profileImage").sort({ date: 1 });

    const todayBookings = allBookings.filter(b => b.date >= startOfToday && b.date <= endOfToday);
    const weeklyBookings = allBookings; // Since we queried from startOfWeek

    let totalTodayBookingsCount = todayBookings.length;
    let totalWeeklyEarnings = 0;

    const barbersOverview = barberProfiles.map(bp => {
      const barberUserId = bp.user._id.toString();
      
      const bToday = todayBookings.filter(b => b.barber._id.toString() === barberUserId);
      const bWeek = weeklyBookings.filter(b => b.barber._id.toString() === barberUserId);
      
      // Calculate earnings for this week (completed bookings)
      const weekEarnings = bWeek
        .filter(b => b.status === "completed")
        .reduce((sum, b) => sum + b.price, 0);
        
      totalWeeklyEarnings += weekEarnings;

      return {
        _id: bp._id,
        user: bp.user,
        rating: bp.rating,
        reviewCount: bp.reviewCount,
        todayBookings: bToday.length,
        weeklyEarnings: weekEarnings
      };
    });

    res.json({
      success: true,
      data: {
        shop,
        barbersOverview,
        combinedBookings: todayBookings,
        stats: {
          todayBookings: totalTodayBookingsCount,
          weeklyEarnings: totalWeeklyEarnings,
          activeBarbers: barbersOverview.length,
        }
      }
    });

  } catch (error) {
    console.error("Error fetching shop dashboard:", error);
    res.status(500).json({ error: "Failed to fetch shop dashboard" });
  }
});
