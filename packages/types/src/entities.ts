import {
  UserRole,
  BookingStatus,
  CancelledBy,
  SubscriptionTier,
  Rating,
  MessageType,
} from "./enums";

// PRD §8.1
export interface User {
  _id: string;
  name: string;
  phone: string; // Kenyan format, +2547...
  role: UserRole;
  profileImage?: string;
  isVerified: boolean; // phone OTP verified
  authProviders: AuthProvider[];
  preferences: {
    bookingUpdates: boolean;
    messages: boolean;
    promotionalOffers: boolean;
    emailNotifications: boolean;
    smsPushNotifications: boolean;
    language: string;
    theme: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Supports the "Continue with Google" login path added to the auth flow.
// A user can have phone auth, Google auth, or both — but every user must
// eventually have a verified phone on file to receive SMS booking
// notifications (PRD §5.8). Google-only signups get routed to OTP
// verification before they can book or list services.
export interface AuthProvider {
  provider: "phone" | "google";
  providerId: string; // phone number, or Google sub claim
  verifiedAt: string | null;
}

// PRD §8.2
export interface GeoPoint {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

export interface WorkingHour {
  dayOfWeek: number; // 0-6 (0=Sunday)
  isOpen: boolean;
  openTime?: string; // e.g. "09:00"
  closeTime?: string; // e.g. "17:00"
}

export interface BarberProfile {
  _id: string;
  userId: string; // ref Users
  user?: {
    _id: string;
    name?: string;
    phone?: string;
    role?: string;
    profileImage?: string;
    rating?: number;
    reviewCount?: number;
    shopName?: string;
    isVerified?: boolean;
  };
  bio?: string;
  tagline?: string;
  location: GeoPoint;
  areaName: string;
  workingHours: WorkingHour[];
  portfolioImages: string[];
  specialties: string[];
  experienceYears?: number;
  rating: number; // computed average
  totalReviews: number;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiry?: string;
  isVerified: boolean;
  isSponsored: boolean;
  sponsoredUntil?: string;
  shopId?: string; // ref Shops — present if this barber is shop staff
  bookingLink: string; // slug
  payoutMethod?: string;
  payoutMethodVerified: boolean;
}

// PRD §8.3
export interface Service {
  _id: string;
  barberId: string;
  name: string;
  price: number; // KES
  duration: number; // minutes
  isActive: boolean;
}

// PRD §8.4
export interface Booking {
  _id: string;
  clientId: string;
  barberId: string;
  serviceId: string;
  date: string;
  timeSlot: string; // e.g. "14:00"
  status: BookingStatus;
  cancelledBy: CancelledBy | null;
  notes?: string;
  reviewLeft: boolean;
  proposedDate?: string;
  proposedTimeSlot?: string;
  proposedBy?: "client" | "barber";
  proposedMessage?: string;
  rescheduleStatus?: "none" | "pending" | "accepted";
}

// PRD §8.5
export interface Review {
  _id: string;
  bookingId: string;
  barberId: string;
  clientId: string;
  rating: Rating;
  comment?: string;
  createdAt: string;
}

// PRD §8.6
export interface Chat {
  _id: string;
  participants: [string, string]; // [clientId, barberId]
  bookingId?: string;
  lastMessage?: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: MessageType;
  readAt: string | null;
}

// PRD §8.7
export interface Shop {
  _id: string;
  ownerId: string; // ref Users, role === shop_owner
  name: string;
  location: GeoPoint;
  areaName: string;
  barbers: string[]; // BarberProfile IDs — staff only, see UserRole note
  subscriptionTier: SubscriptionTier.SHOP;
  subscriptionExpiry?: string;
  description?: string;
  logo?: string;
  cancellationPolicy: string;
  bookingLeadTime: string;
  autoConfirmBookings: boolean;
  payoutMethod?: string;
  payoutMethodVerified: boolean;
}
