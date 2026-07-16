import mongoose, { Schema, Document } from "mongoose";
import { BookingStatus, CancelledBy } from "@kinyozihub/types";

export interface BookingDocument extends Document {
  client: mongoose.Types.ObjectId;
  barber: mongoose.Types.ObjectId;
  serviceId: string;
  serviceName: string;
  price: number;
  date: Date;
  timeSlot: string;
  status: BookingStatus;
  cancelledBy: CancelledBy | null;
  notes?: string;
  reviewLeft: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema({
  client: { type: Schema.Types.ObjectId, ref: "User", required: true },
  barber: { type: Schema.Types.ObjectId, ref: "User", required: true },
  serviceId: { type: String, required: true },
  serviceName: { type: String, required: true },
  price: { type: Number, required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  status: { type: String, enum: Object.values(BookingStatus), required: true, default: BookingStatus.PENDING },
  cancelledBy: { type: String, enum: Object.values(CancelledBy), default: null },
  notes: { type: String },
  reviewLeft: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Compound index to prevent double booking the same slot
// We use a partial filter so cancelled bookings don't block new ones for the same slot
bookingSchema.index(
  { barber: 1, date: 1, timeSlot: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: BookingStatus.CANCELLED } } }
);

export const Booking = mongoose.model<BookingDocument>("Booking", bookingSchema);
