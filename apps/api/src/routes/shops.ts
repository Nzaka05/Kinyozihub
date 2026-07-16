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
        shop: {
          _id: shop._id,
          name: shop.name,
          location: shop.location,
          areaName: shop.areaName,
          subscriptionTier: shop.subscriptionTier,
          inviteCode: shop.inviteCode
        },
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

shopsRouter.get("/me/bookings", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { User } = require("../models/User");
    const user = await User.findById(userId);

    if (user?.role !== "shop_owner") {
      return res.status(403).json({ error: "Forbidden: Not a shop owner" });
    }

    const { Shop } = require("../models/Shop");
    const shop = await Shop.findOne({ ownerId: userId });
    
    if (!shop) {
      return res.json({ success: true, data: [] });
    }

    const { BarberProfile } = require("../models/BarberProfile");
    const barberProfiles = await BarberProfile.find({ shopId: shop._id }).populate("user", "_id");
    const barberUserIds = barberProfiles.map((bp: any) => bp.user._id);

    const { Booking } = require("../models/Booking");
    const bookings = await Booking.find({ barber: { $in: barberUserIds } })
      .populate("client", "name profileImage phone")
      .populate("barber", "name profileImage")
      .sort({ date: 1, timeSlot: 1 })
      .exec();

    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error("Error fetching shop bookings:", error);
    res.status(500).json({ error: "Failed to fetch shop bookings" });
  }
});

shopsRouter.post("/me/invite-code", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const shop = await Shop.findOne({ ownerId: userId });
    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    // Generate unique 8-char code, retry up to 3 times on collision
    let newCode = '';
    let success = false;
    for (let i = 0; i < 3; i++) {
      newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      try {
        shop.inviteCode = newCode;
        await shop.save();
        success = true;
        break; // Success!
      } catch (err: any) {
        if (err.code === 11000) { // Duplicate key error
          continue; // Try again
        }
        throw err; // Other error, throw it
      }
    }

    if (!success) {
      return res.status(500).json({ success: false, message: "Failed to generate a unique invite code after multiple attempts. Please try again." });
    }

    return res.json({ success: true, inviteCode: newCode });
  } catch (error) {
    console.error("Error generating invite code:", error);
    res.status(500).json({ error: "Failed to generate invite code" });
  }
});

shopsRouter.put("/me/settings", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const shop = await Shop.findOne({ ownerId: userId });
    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    const { name, description, cancellationPolicy, bookingLeadTime, autoConfirmBookings, payoutMethod } = req.body;

    if (name !== undefined) shop.name = name;
    if (description !== undefined) shop.description = description;
    if (cancellationPolicy !== undefined) shop.cancellationPolicy = cancellationPolicy;
    if (bookingLeadTime !== undefined) shop.bookingLeadTime = bookingLeadTime;
    if (autoConfirmBookings !== undefined) shop.autoConfirmBookings = autoConfirmBookings;
    
    // If payoutMethod changes, mark it as unverified
    if (payoutMethod !== undefined && shop.payoutMethod !== payoutMethod) {
      shop.payoutMethod = payoutMethod;
      shop.payoutMethodVerified = false;
    }

    await shop.save();

    return res.json({ success: true, data: shop });
  } catch (error) {
    console.error("Error updating shop settings:", error);
    res.status(500).json({ error: "Failed to update shop settings" });
  }
});
