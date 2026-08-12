import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { Review } from "../models/Review";
import { Booking } from "../models/Booking";
import { BarberProfile } from "../models/BarberProfile";
import { BookingStatus } from "@kinyozihub/types";

export const reviewsRouter = Router();

// POST /api/reviews
reviewsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const clientId = req.user!.id;
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || rating === undefined) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be an integer between 1 and 5" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.client.toString() !== clientId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      return res.status(400).json({ success: false, message: "Booking is not completed" });
    }

    if (booking.reviewLeft) {
      return res.status(400).json({ success: false, message: "Review already left for this booking" });
    }

    const review = new Review({
      booking: booking._id,
      client: clientId,
      barber: booking.barber,
      rating,
      comment
    });

    await review.save();

    booking.reviewLeft = true;
    await booking.save();

    // Recalculate rating and reviewCount using aggregation
    const stats = await Review.aggregate([
      { $match: { barber: booking.barber } },
      { $group: { _id: "$barber", averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } }
    ]);

    if (stats.length > 0) {
      await BarberProfile.findOneAndUpdate(
        { user: booking.barber },
        { 
          rating: Number(stats[0].averageRating.toFixed(1)),
          reviewCount: stats[0].totalReviews
        }
      );
    }

    res.status(201).json({ success: true, data: review });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Review already exists for this booking" });
    }
    console.error("Error creating review:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
