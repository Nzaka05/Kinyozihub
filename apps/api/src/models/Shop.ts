import mongoose, { Document, Schema } from 'mongoose';
import { SubscriptionTier } from '@kinyozihub/types';

export interface IShop extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  location: {
    type: string;
    coordinates: number[];
  };
  areaName: string;
  barbers: mongoose.Types.ObjectId[];
  subscriptionTier: string;
  subscriptionExpiry?: Date;
  inviteCode?: string;
  description?: string;
  logo?: string;
  cancellationPolicy: string;
  bookingLeadTime: string;
  autoConfirmBookings: boolean;
  payoutMethod?: string;
  payoutMethodVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shopSchema = new Schema<IShop>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    areaName: { type: String, required: true },
    barbers: [{ type: Schema.Types.ObjectId, ref: 'BarberProfile' }],
    subscriptionTier: { type: String, enum: Object.values(SubscriptionTier), default: SubscriptionTier.FREE },
    subscriptionExpiry: { type: Date },
    inviteCode: { type: String, unique: true, sparse: true },
    description: { type: String, required: false },
    logo: { type: String, required: false },
    cancellationPolicy: { type: String, enum: ["Flexible", "Moderate", "Strict"], default: "Flexible" },
    bookingLeadTime: { type: String, default: "2 hours" },
    autoConfirmBookings: { type: Boolean, default: false },
    payoutMethod: { type: String, required: false },
    payoutMethodVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Create a 2dsphere index for location-based queries
shopSchema.index({ location: '2dsphere' });

export const Shop = mongoose.models.Shop || mongoose.model<IShop>('Shop', shopSchema);
