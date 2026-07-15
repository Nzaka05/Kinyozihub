/**
 * Source of truth for every enum shared across apps/web, apps/mobile, and
 * apps/api. Do NOT redefine these locally in an app — import from here.
 * If a new coding session (Antigravity/OpenCode) needs a new status value,
 * it goes here first, not inline in a controller or component.
 */

// PRD §4 — User Roles & Permissions
// NOTE: single-value by design. A person who is both a shop owner and an
// independent barber holds TWO separate User accounts (decided explicitly
// during design review — shop owners do not get a linked BarberProfile
// under their own shop_owner account in V1). Do not "fix" this into an
// array without re-opening that decision.
export enum UserRole {
  CLIENT = "client",
  BARBER = "barber",
  SHOP_OWNER = "shop_owner",
  ADMIN = "admin",
}

// PRD §5.5 — Booking System
export enum BookingStatus {
  PENDING = "pending", // barber has not yet responded
  CONFIRMED = "confirmed", // barber accepted
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum CancelledBy {
  CLIENT = "client",
  BARBER = "barber",
}

// PRD §6.1 — Subscription Tiers
export enum SubscriptionTier {
  FREE = "free",
  PRO = "pro",
  SHOP = "shop",
}

// PRD §5.6 — Ratings & Reviews (1-5 stars, enforced at the type level too)
export type Rating = 1 | 2 | 3 | 4 | 5;

// PRD §5.7 — Messaging
export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
}
