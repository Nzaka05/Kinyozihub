# KinyoziHub — Turborepo scaffold

## What's real here

- `packages/types` — **fully implemented, type-checks clean.** Every enum
  (`UserRole`, `BookingStatus`, `SubscriptionTier`, etc.), every entity
  interface matching PRD §8's schema, and the `checkCancellationEligibility()`
  function that codifies the pending-vs-confirmed cancellation rule (fixed
  in the Stitch prototype, now enforced as one function instead of
  reimplemented per-app). **Import from here, don't redefine locally.**
- `packages/ui/src/tokens.ts` — the confirmed design system (coral primary,
  deep teal secondary, amber for sponsored/pending) as shared constants.
- `turbo.json` + root `package.json` — real workspace config, `npm install`
  from root will link everything.

## What's a stub

- `apps/web`, `apps/mobile` — package.json + dependency wiring only. Actual
  `create-next-app` / `create-expo-app` scaffolding was deliberately left
  out of this pass rather than run blind — worth running deliberately with
  you present to pick options (App Router vs Pages, src/ dir, import
  alias, etc.) rather than defaulted.
- `apps/api` — one `console.log` entry file proving the `@kinyozihub/types`
  import resolves. No Express app, no routes, no MongoDB connection yet.

## Known open items from design review (not yet reflected in code)

- **Shop owner ≠ barber**: `UserRole` is intentionally single-value.
  A person who owns a shop AND wants to personally take client bookings
  needs two separate `User` accounts in V1 — see the comment in
  `packages/types/src/enums.ts`. Don't "fix" this into a role array without
  revisiting that decision.
- **Google OAuth**: `AuthProvider` interface supports it, but a Google-only
  signup with no verified phone can't receive SMS booking notifications
  (PRD §5.8 requires phone for that). The routing that forces phone
  verification after Google signup isn't built yet — flagged in
  `entities.ts`.

## Next build step (PRD §10 Phase 1 order)

1. Auth: OTP (Africa's Talking) + JWT + role select, matching the Stitch
   auth flow already approved.
2. Barber profiles + service management + location discovery.
3. Booking system wired to `checkCancellationEligibility()`.
4. Reviews + chat (Socket.io).
5. Dashboards (barber, then shop owner using the Combined Bookings /
   Staff Schedule structure already approved in Stitch).
