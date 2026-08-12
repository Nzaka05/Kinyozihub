import mongoose, { Schema, Document } from "mongoose";

export interface BlockedTimeDocument extends Document {
  barber: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  reason: "Personal" | "Lunch Break" | "Holiday" | "Other";
  isRecurring: boolean;
  recurringDayOfWeek?: number;
  createdAt: Date;
  updatedAt: Date;
}

const blockedTimeSchema = new Schema({
  barber: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  reason: { 
    type: String, 
    enum: ["Personal", "Lunch Break", "Holiday", "Other"], 
    required: true 
  },
  isRecurring: { type: Boolean, default: false },
  recurringDayOfWeek: { type: Number, required: false }
}, {
  timestamps: true
});

export const BlockedTime = mongoose.model<BlockedTimeDocument>("BlockedTime", blockedTimeSchema);
