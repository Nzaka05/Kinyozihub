import mongoose, { Schema, Document } from "mongoose";

export interface RefreshTokenDocument extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string; // The hashed refresh token
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

const refreshTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  isRevoked: { type: Boolean, default: false }
}, { timestamps: { createdAt: true, updatedAt: false } });

// Index for TTL (automatically remove expired tokens)
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model<RefreshTokenDocument>("RefreshToken", refreshTokenSchema);
