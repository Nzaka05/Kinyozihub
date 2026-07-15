import crypto from "crypto";

export interface OtpProvider {
  sendOtp(phone: string, code: string): Promise<void>;
}

export class MockOtpProvider implements OtpProvider {
  async sendOtp(phone: string, code: string): Promise<void> {
    console.log(`[MOCK SMS] OTP for ${phone}: ${code}`);
  }
}

// TODO: Future implementation
// export class AfricasTalkingProvider implements OtpProvider { ... }

export function getOtpProvider(): OtpProvider {
  const providerType = process.env.OTP_PROVIDER || "mock";
  if (providerType === "mock") {
    return new MockOtpProvider();
  }
  // if (providerType === "africastalking") return new AfricasTalkingProvider();
  
  throw new Error(`Unknown OTP_PROVIDER: ${providerType}`);
}

// --- OTP Session Storage (In-Memory for now, to be moved to DB) ---

interface OtpSession {
  hash: string;
  expiresAt: number;
  attempts: number;
}

const otpStore = new Map<string, OtpSession>();

export function generateAndStoreOtp(phone: string): string {
  // Generate 4-digit code
  const code = "1234"; // Hardcoded for e2e test
  
  // Hash it
  const hash = crypto.createHash('sha256').update(code).digest('hex');
  
  // Store with 5 min expiry and 0 attempts
  otpStore.set(phone, {
    hash,
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0
  });

  return code;
}

export function verifyStoredOtp(phone: string, submittedCode: string): boolean {
  const session = otpStore.get(phone);
  if (!session) return false;

  if (Date.now() > session.expiresAt) {
    otpStore.delete(phone);
    return false;
  }

  if (session.attempts >= 3) {
    otpStore.delete(phone);
    return false;
  }

  session.attempts += 1;

  const submittedHash = crypto.createHash('sha256').update(submittedCode).digest('hex');
  if (submittedHash !== session.hash) {
    // If failed, update store with new attempt count
    otpStore.set(phone, session);
    return false;
  }

  // Success: clear session so it can't be reused
  otpStore.delete(phone);
  return true;
}
