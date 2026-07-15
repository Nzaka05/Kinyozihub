import { z } from "zod";

export const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+254\d{9}$/, "Invalid phone number format"),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+254\d{9}$/, "Invalid phone number format"),
  code: z.string().length(4, "OTP must be 4 digits"),
  googleRegistrationToken: z.string().optional(),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
});

export const registerSchema = z.object({
  phone: z.string().regex(/^\+254\d{9}$/, "Invalid phone number format"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["client", "barber", "shop_owner"]),
  googleRegistrationToken: z.string().optional(),
});
