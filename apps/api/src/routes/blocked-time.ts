import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { BlockedTime } from "../models/BlockedTime";
import { Booking } from "../models/Booking";
import { BookingStatus } from "@kinyozihub/types";
import { User } from "../models/User";

const router = Router();

router.use(requireAuth);

const requireBarber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    
    const user = await User.findById(userId);
    if (!user || user.role !== "barber") {
      return res.status(403).json({ success: false, message: "Forbidden: Only barbers can manage blocked time" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Helper to convert "01:00 PM" to "13:00"
const to24Hour = (timeStr: string) => {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":");
  if (hours === "12") {
    hours = "00";
  }
  if (modifier === "PM") {
    hours = (parseInt(hours, 10) + 12).toString();
  }
  return `${hours.padStart(2, "0")}:${minutes}`;
};

// POST /blocked-time - Barber creates a block
router.post("/", requireBarber, async (req, res) => {
  try {
    const barberId = req.user?.id;
    const { date, startTime, endTime, reason, isRecurring, recurringDayOfWeek, confirmDespiteConflict } = req.body;

    // Skip conflict-checking for recurring blocks
    if (!confirmDespiteConflict && !isRecurring) {
      const parsedDate = new Date(date);
      // Ensure we query start of day for accurate match
      const startOfDay = new Date(parsedDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(parsedDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const query: any = {
        barber: barberId,
        status: BookingStatus.CONFIRMED,
        date: { $gte: startOfDay, $lte: endOfDay }
      };

      const bookings = await Booking.find(query).populate("client", "name");

      let conflict = null;
      for (const booking of bookings) {
        // Normalize AM/PM from DB to 24h format for comparison
        const bookingTime24 = booking.timeSlot.includes(" ") ? to24Hour(booking.timeSlot) : booking.timeSlot;
        
        // Simple overlap check: bookingTime is equal to or within the block range
        // Since appointments take time (e.g. 1 hour), if the booking starts inside the block, it's a conflict.
        if (bookingTime24 >= startTime && bookingTime24 < endTime) {
          conflict = booking;
          break;
        }
      }

      if (conflict) {
        const client = conflict.client as any;
        return res.status(200).json({
          success: true,
          conflict: true,
          conflictingBooking: {
            clientName: client?.name || "Client",
            time: conflict.timeSlot,
            date: conflict.date
          }
        });
      }
    }

    const block = await BlockedTime.create({
      barber: barberId,
      date,
      startTime,
      endTime,
      reason,
      isRecurring: isRecurring || false,
      recurringDayOfWeek
    });

    res.status(201).json(block);
  } catch (error) {
    res.status(500).json({ error: "Failed to create block" });
  }
});

// GET /blocked-time/mine - List barber's own blocks
router.get("/mine", requireBarber, async (req, res) => {
  try {
    const blocks = await BlockedTime.find({ barber: req.user?.id }).sort({ date: 1 });
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch blocked time" });
  }
});

// DELETE /blocked-time/:id - Deletes the block/rule entirely
router.delete("/:id", requireBarber, async (req, res) => {
  try {
    const block = await BlockedTime.findOneAndDelete({ _id: req.params.id, barber: req.user?.id });
    if (!block) {
      return res.status(404).json({ error: "Blocked time not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete blocked time" });
  }
});

export default router;
