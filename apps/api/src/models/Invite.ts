import mongoose, { Document, Schema } from 'mongoose';

export interface IInvite extends Document {
  shopId: mongoose.Types.ObjectId;
  code: string;
  status: 'pending' | 'accepted' | 'expired';
  invitedBy: mongoose.Types.ObjectId;
  acceptedBy?: mongoose.Types.ObjectId;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inviteSchema = new Schema<IInvite>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    code: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    acceptedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    acceptedAt: { type: Date, required: false },
  },
  {
    timestamps: true,
  }
);

export const Invite = mongoose.models.Invite || mongoose.model<IInvite>('Invite', inviteSchema);
