import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  bookingId?: mongoose.Types.ObjectId;
  conversationType: 'booking' | 'staff';
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageReadBy?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: false,
    },
    conversationType: {
      type: String,
      enum: ['booking', 'staff'],
      default: 'booking',
      required: true,
    },
    lastMessage: {
      type: String,
    },
    lastMessageAt: {
      type: Date,
    },
    lastMessageReadBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Ensure a unique conversation per booking, but allow multiple without bookingId
ConversationSchema.index({ bookingId: 1 }, { unique: true, sparse: true });
ConversationSchema.index({ participants: 1 });

export const Conversation =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>('Conversation', ConversationSchema);
