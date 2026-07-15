import mongoose, { Document, Schema } from 'mongoose';

export interface IBarberProfile extends Document {
  user: mongoose.Types.ObjectId;
  shopId?: mongoose.Types.ObjectId;
  shopName: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  priceRange: string;
  distanceString: string;
  nextAvailable: string;
  profileImage: string;
  tier: 'free' | 'premium';
  commissionRate: number;
  isSponsored: boolean;
  portfolioImages: string[];
  createdAt: Date;
  updatedAt: Date;
}

const barberProfileSchema = new Schema<IBarberProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop' },
    shopName: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    priceRange: { type: String, required: true },
    distanceString: { type: String, required: true },
    nextAvailable: { type: String, required: true },
    profileImage: { type: String, required: true },
    tier: { type: String, enum: ['free', 'premium'], default: 'free' },
    commissionRate: { type: Number, default: 0.10 },
    isSponsored: { type: Boolean, default: false },
    portfolioImages: [{ type: String }]
  },
  {
    timestamps: true,
  }
);

export const BarberProfile = mongoose.models.BarberProfile || mongoose.model<IBarberProfile>('BarberProfile', barberProfileSchema);
