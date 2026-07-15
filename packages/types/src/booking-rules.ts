import { BookingStatus } from "./enums";

const CANCELLATION_LOCKOUT_HOURS = 2;

export interface CancellationCheckInput {
  status: BookingStatus;
  appointmentDateTime: Date;
  now?: Date;
}

export type CancellationEligibility =
  | { canCancel: true }
  | { canCancel: false; reason: "already_terminal" }
  | { canCancel: false; reason: "within_lockout_window"; hoursUntilAppointment: number };

/**
 * Single source of truth for whether a client can cancel a booking.
 *
 * Rule (confirmed during design review, fixed in the My Bookings Stitch
 * prototype after it initially shipped backwards):
 *   - PENDING bookings (barber hasn't responded) can ALWAYS be withdrawn.
 *     Nothing is confirmed yet, so there's no commitment to protect.
 *   - CONFIRMED bookings can be cancelled up to 2 hours before the
 *     appointment (PRD §5.5). Inside that window, cancellation is blocked.
 *   - COMPLETED / CANCELLED are terminal states — no action available.
 *
 * Do not reimplement this inline in a component or route handler. If the
 * lockout window ever changes, it changes here once.
 */
export function checkCancellationEligibility(
  input: CancellationCheckInput
): CancellationEligibility {
  const now = input.now ?? new Date();

  if (input.status === BookingStatus.COMPLETED || input.status === BookingStatus.CANCELLED) {
    return { canCancel: false, reason: "already_terminal" };
  }

  if (input.status === BookingStatus.PENDING) {
    return { canCancel: true };
  }

  // status === CONFIRMED
  const hoursUntilAppointment =
    (input.appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilAppointment < CANCELLATION_LOCKOUT_HOURS) {
    return {
      canCancel: false,
      reason: "within_lockout_window",
      hoursUntilAppointment,
    };
  }

  return { canCancel: true };
}
