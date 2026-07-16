import mongoose, { Schema, Document } from "mongoose";
import { User as IUser, UserRole } from "@kinyozihub/types";

export interface UserDocument extends Omit<IUser, "_id" | "createdAt" | "updatedAt">, Document {
  createdAt: Date;
  updatedAt: Date;
}

const authProviderSchema = new Schema({
  provider: { type: String, enum: ["phone", "google"], required: true },
  providerId: { type: String, required: true },
  verifiedAt: { type: Date, default: null }
}, { _id: false });

const userPreferencesSchema = new Schema({
  bookingUpdates: { type: Boolean, default: true },
  messages: { type: Boolean, default: true },
  promotionalOffers: { type: Boolean, default: false },
  emailNotifications: { type: Boolean, default: true },
  smsPushNotifications: { type: Boolean, default: true },
  language: { type: String, default: "en" },
  theme: { type: String, enum: ["light", "dark", "system"], default: "light" }
}, { _id: false });

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: false },
  phone: { type: String, required: true, unique: true },
  role: { type: String, enum: Object.values(UserRole), required: true },
  profileImage: { type: String, required: false },
  isVerified: { type: Boolean, default: false, required: true },
  authProviders: { type: [authProviderSchema], required: true, default: [] },
  preferences: { type: userPreferencesSchema, default: () => ({}) }
}, { 
  timestamps: true
});

export const User = mongoose.model<UserDocument>("User", userSchema);
