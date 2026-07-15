/**
 * Matches the design system established and approved across every
 * KinyoziHub Stitch screen (Landing, Discovery, Barber Profile, Booking
 * Flow, Barber Dashboard, Shop Owner Dashboard, Auth, Messaging,
 * My Bookings). Keep this in sync if the design changes — don't let web
 * and mobile drift into separate palettes.
 */
export const colors = {
  background: "#FAFAFA",
  surface: "#FFFFFF",
  textPrimary: "#1A1A1A",
  primary: "#FF385C", // coral — primary CTAs only, used sparingly
  secondary: "#0D4F4F", // deep teal — verified badges, barber-facing sections
  sponsored: "#F5A623", // amber — sponsored/pending labels only
  success: "#1DA463",
  border: "#EBEBEB",
} as const;

export const radii = {
  card: 16,
  button: 12,
} as const;

export const fontFamily = "Inter" as const;
