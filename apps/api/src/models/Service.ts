import mongoose, { Schema, Document } from "mongoose";

export interface ServiceDocument extends Document {
  barber: mongoose.Types.ObjectId;
  name: string;
  price: number;
  duration: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema(
  {
    barber: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Service = mongoose.model<ServiceDocument>("Service", serviceSchema);
