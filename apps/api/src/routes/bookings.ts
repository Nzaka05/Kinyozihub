import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { Booking } from "../models/Booking";

export const bookingsRouter = Router();

bookingsRouter.use(requireAuth);

bookingsRouter.get("/", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { User } = require("../models/User");
    const user = await User.findById(userId);

    let bookings;
    if (user?.role === "barber") {
      bookings = await Booking.find({ barber: userId })
        .populate("client", "name profileImage phone")
        .sort({ date: 1 })
        .exec();
    } else {
      // Fetch bookings for the logged-in user, populate barber details
      bookings = await Booking.find({ client: userId })
        .populate("barber", "name profileImage rating totalReviews")
        .sort({ date: 1 })
        .exec();
    }

    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// DEV ONLY: Seed bookings for the logged-in user
bookingsRouter.post("/seed", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if user already has bookings
    const existing = await Booking.countDocuments({ client: userId });
    if (existing > 0) {
      return res.json({ success: true, message: "Bookings already seeded" });
    }

    const { User } = require("../models/User");
    const user = await User.findById(userId);
    
    let clientId = userId;
    let barberId;

    if (user?.role === "barber") {
      barberId = userId;
      // Need a dummy client
      let client = await User.findOne({ role: "client" });
      if (!client) {
        client = await User.create({
          name: "Samuel O.",
          phone: "+254700000001",
          role: "client",
          isVerified: true,
          authProviders: [{ provider: "phone", providerId: "+254700000001", verifiedAt: new Date() }],
          profileImage: "https://i.pravatar.cc/400?img=32"
        });
      }
      clientId = client._id;
    } else {
      // Need a dummy barber
      let barber = await User.findOne({ role: "barber" });
      if (!barber) {
        barber = await User.create({
          name: "Jabari Omondi",
          phone: "+254700000000",
          role: "barber",
          isVerified: true,
          authProviders: [{ provider: "phone", providerId: "+254700000000", verifiedAt: new Date() }],
          profileImage: "https://i.pravatar.cc/400?img=33"
        });
      }
      barberId = barber._id;
    }

    const now = new Date();
    
    // Booking 1: PENDING, tomorrow
    const pendingDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Booking 2: CONFIRMED, in 1 hour (cannot cancel)
    const confirmedSoonDate = new Date(now.getTime() + 1 * 60 * 60 * 1000);

    // Booking 3: CONFIRMED, in 3 days
    const confirmedLaterDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Booking 4: COMPLETED, yesterday
    const completedDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const newBookings = await Booking.insertMany([
      {
        client: clientId,
        barber: barberId,
        serviceId: "srv_1",
        serviceName: "Signature Fade",
        price: 1500,
        date: pendingDate,
        timeSlot: "10:00 AM",
        status: "pending"
      },
      {
        client: clientId,
        barber: barberId,
        serviceId: "srv_1",
        serviceName: "Signature Fade",
        price: 1500,
        date: confirmedSoonDate,
        timeSlot: "12:00 PM",
        status: "confirmed"
      },
      {
        client: clientId,
        barber: barberId,
        serviceId: "srv_2",
        serviceName: "Beard Trim",
        price: 800,
        date: confirmedLaterDate,
        timeSlot: "02:00 PM",
        status: "confirmed"
      },
      {
        client: clientId,
        barber: barberId,
        serviceId: "srv_1",
        serviceName: "Classic Cut",
        price: 1200,
        date: completedDate,
        timeSlot: "03:00 PM",
        status: "completed"
      }
    ]);

    res.json({ success: true, message: "Seeded 4 bookings", data: newBookings });
  } catch (error) {
    console.error("Failed to seed bookings:", error);
    res.status(500).json({ error: "Failed to seed bookings" });
  }
});

bookingsRouter.post("/", async (req, res) => {
  try {
    // 2. Derive client from auth token, NOT request body
    const clientId = req.user?.id;
    if (!clientId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { barberId, serviceId, serviceName, price, date, timeSlot, notes } = req.body;

    if (!barberId || !serviceId || !date || !timeSlot) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Parse the date and normalize to start of day for exact matching
    const parsedDate = new Date(date);
    const bookingDate = new Date(parsedDate.setHours(0, 0, 0, 0));

    // 3. Add booking conflict check
    // Query for an existing booking with the same barber + date + timeSlot that isn't cancelled
    const conflict = await Booking.findOne({
      barber: barberId,
      date: bookingDate,
      timeSlot: timeSlot,
      status: { $ne: "cancelled" }
    });

    if (conflict) {
      return res.status(409).json({ error: "This slot is no longer available" });
    }

    const newBooking = await Booking.create({
      client: clientId, // Set from auth
      barber: barberId,
      serviceId,
      serviceName,
      price: price || 0,
      date: bookingDate,
      timeSlot,
      notes,
      status: "pending" // Default status
    });

    const { User } = require("../models/User");
    const { Notification } = require("../models/Notification");
    const clientUser = await User.findById(clientId);

    await Notification.create({
      userId: barberId,
      type: "booking",
      title: "New Booking Request",
      message: `New booking request from ${clientUser?.name || "a client"} for ${serviceName}.`,
      relatedId: newBooking._id
    });

    res.status(201).json({ success: true, data: newBooking });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

bookingsRouter.patch("/:id/status", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { status } = req.body;
    const bookingId = req.params.id;

    if (!["confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status update" });
    }

    const { User } = require("../models/User");
    const user = await User.findById(userId);

    if (user?.role !== "barber") {
      return res.status(403).json({ error: "Only barbers can accept or decline bookings" });
    }

    const booking = await Booking.findOne({ _id: bookingId, barber: userId });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found or not owned by you" });
    }

    if (booking.status === status) {
      // Idempotent return: already in the requested state
      return res.json({ success: true, data: booking });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({ error: "Booking has already been processed" });
    }

    booking.status = status as any;
    if (status === "cancelled") {
      booking.cancelledBy = "barber" as any;
    }

    await booking.save();

    // Trigger Notification to Client
    const { Notification } = require("../models/Notification");
    const title = status === "confirmed" ? "Booking Confirmed" : "Booking Declined";
    const actionWords = status === "confirmed" ? "confirmed" : "declined";
    
    await Notification.create({
      userId: booking.client,
      type: "booking",
      title: title,
      message: `${user.name || "Your barber"} has ${actionWords} your booking for ${booking.serviceName}.`,
      relatedId: booking._id
    });

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error("Failed to update booking status:", error);
    res.status(500).json({ error: "Failed to update booking status" });
  }
});

bookingsRouter.get("/:id", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const bookingId = req.params.id;
    
    // We populate both client and barber since this endpoint might be called by either
    const booking = await Booking.findById(bookingId)
      .populate("client", "name profileImage")
      .populate("barber", "name profileImage rating totalReviews");

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Verify ownership
    const clientId = (booking.client as any)?._id?.toString() || booking.client?.toString();
    const barberId = (booking.barber as any)?._id?.toString() || booking.barber?.toString();

    if (clientId !== userId && barberId !== userId) {
      return res.status(403).json({ error: "Forbidden: You do not have access to this booking" });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error("Failed to fetch booking:", error);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});
