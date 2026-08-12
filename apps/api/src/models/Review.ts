import mongoose, { Schema, Document } from "mongoose";

export interface ReviewDocument extends Document {
  booking: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  barber: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema({
  booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
  client: { type: Schema.Types.ObjectId, ref: "User", required: true },
  barber: { type: Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 500 }
}, {
  timestamps: true
});

export const Review = mongoose.model<ReviewDocument>("Review", reviewSchema);
