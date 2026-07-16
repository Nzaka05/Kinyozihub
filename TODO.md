# Project TODOs & Known Gaps

## Authentication & Onboarding
- **Barber-to-shop association flow not implemented**: Currently, when a barber signs up, there is no UI or flow for them to join a shop or for a shop owner to invite them. It currently requires a manual DB fix to link `BarberProfile.shopId` to a `Shop._id`.
  - *Location*: Needs to be built into the onboarding flow or shop management dashboard.
  - *Note added to*: `apps/api/src/routes/auth.ts`

## Models & Data
- **Services Hardcoding**: Services are currently hardcoded in various places. This needs to become a real `Service` model tied to `BarberProfile` or `Shop` before production. Do not let this silently become permanent.

## Bookings
- **Booking Conflict Checks**: Need application-level conflict checks to prevent double booking. (Implemented in basic form with DB unique index, but should have explicit application-level handling).

## Settings & Profile
- **Dark Mode / Theme Switching**: Currently, the `theme` user preference defaults to `light`. The frontend does not yet have full Dark Mode support (`next-themes` and `dark:` tailwind class implementation). Theme-switching is a tracked future item and the UI theme toggle should be treated as non-functional or omitted until implemented.
- **Payout Processing Constraint**: Payout processing (whenever built) MUST check the `payoutMethodVerified` boolean field. Do not pay out to an unverified M-Pesa number. Wait for the OTP confirmation backend to be implemented before relying on `payoutMethod`.
