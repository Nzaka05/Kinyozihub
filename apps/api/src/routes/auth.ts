import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { 
  sendOtpSchema, 
  verifyOtpSchema, 
  googleAuthSchema, 
  registerSchema 
} from "@kinyozihub/types";
import { generateAndStoreOtp, verifyStoredOtp, getOtpProvider } from "../services/otp.service";
import { User } from "../models/User";
import { RefreshToken } from "../models/RefreshToken";

export const authRouter = Router();

// Configure the OAuth2Client. We rely on the environment variable GOOGLE_CLIENT_ID
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateTokens = async (userId: string) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
  
  // Generate random string for refresh token
  const refreshToken = crypto.randomBytes(40).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  
  // Store refresh token
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt
  });

  return { accessToken, refreshToken };
};

// Endpoint: /api/auth/send-otp
authRouter.post("/send-otp", async (req, res) => {
  try {
    const { phone } = sendOtpSchema.parse(req.body);
    
    const code = generateAndStoreOtp(phone);
    
    const provider = getOtpProvider();
    await provider.sendOtp(phone, code);

    res.json({ success: true, message: "OTP sent" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Invalid request or unable to send OTP" });
  }
});

// Endpoint: /api/auth/verify-otp
authRouter.post("/verify-otp", async (req, res) => {
  try {
    const { phone, code, googleRegistrationToken } = verifyOtpSchema.parse(req.body);
    
    const isValid = verifyStoredOtp(phone, code);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid, expired, or max attempts reached" });
    }

    const user = await User.findOne({ phone });

    if (user) {
      // If the user provided a googleRegistrationToken but the phone is already mapped to an existing account,
      // we link the Google account to this existing user instead of throwing an error.
      if (googleRegistrationToken) {
        try {
          const googlePayload: any = jwt.verify(googleRegistrationToken, process.env.JWT_SECRET as string);
          if (googlePayload.sub) {
            const hasGoogle = user.authProviders.some((ap: any) => ap.provider === "google");
            if (!hasGoogle) {
              user.authProviders.push({
                provider: "google",
                providerId: googlePayload.sub,
                verifiedAt: new Date()
              });
              await user.save();
            }
          }
        } catch (err) {
          return res.status(401).json({ error: "Invalid or expired google registration token" });
        }
      }

      // Login flow
      const { accessToken, refreshToken } = await generateTokens(user._id.toString());
      
      res.cookie("refreshToken", refreshToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/auth/refresh",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      return res.json({ 
        success: true, 
        isNewUser: false, 
        accessToken,
        user: { name: user.name, role: user.role }
      });
    } else {
      // Registration flow
      const registrationToken = jwt.sign(
        { phone }, 
        process.env.JWT_SECRET as string, 
        { expiresIn: "15m" }
      );
      return res.json({ success: true, isNewUser: true, registrationToken });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Invalid request" });
  }
});

// Endpoint: /api/auth/google
authRouter.post("/google", async (req, res) => {
  try {
    const { idToken } = googleAuthSchema.parse(req.body);
    
    // 1. Verify the ID token cryptographically
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: "Invalid Google ID token" });
    }

    const { sub, email, name } = payload;

    // 2. Check if a User exists with this Google sub
    const user = await User.findOne({ 
      authProviders: { $elemMatch: { provider: "google", providerId: sub } } 
    });

    if (user) {
      // Login flow
      const { accessToken, refreshToken } = await generateTokens(user._id.toString());
      
      res.cookie("refreshToken", refreshToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/auth/refresh",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      return res.json({ 
        success: true, 
        isNewUser: false, 
        accessToken,
        user: { name: user.name, role: user.role }
      });
    } else {
      // 3 & 4. New user: issue temporary googleRegistrationToken and route to Phone Entry
      // Note: We skip checking if the email is already linked via phone. This is a known gap we can address later.
      const googleRegistrationToken = jwt.sign(
        { sub, email, name },
        process.env.JWT_SECRET as string,
        { expiresIn: "30m" }
      );

      return res.json({ 
        success: true, 
        isNewUser: true, 
        pendingPhoneVerification: true, 
        googleRegistrationToken 
      });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Invalid request or token verification failed" });
  }
});

// Endpoint: /api/auth/register
authRouter.post("/register", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing registration token" });
    }
    const token = authHeader.split(" ")[1];

    let verifiedPayload: any;
    try {
      verifiedPayload = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired registration token" });
    }

    const verifiedPhone = verifiedPayload.phone;
    if (!verifiedPhone) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    const { name, role, googleRegistrationToken } = registerSchema.omit({ phone: true }).parse(req.body);

    let user = await User.findOne({ phone: verifiedPhone });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Build the authProviders array (always includes phone)
    const authProviders: any[] = [
      { provider: "phone", providerId: verifiedPhone, verifiedAt: new Date() }
    ];

    // If a Google token is provided, verify it and append it to authProviders
    if (googleRegistrationToken) {
      try {
        const googlePayload: any = jwt.verify(googleRegistrationToken, process.env.JWT_SECRET as string);
        if (googlePayload.sub) {
          const existingGoogleUser = await User.findOne({ 
            authProviders: { $elemMatch: { provider: "google", providerId: googlePayload.sub } } 
          });
          
          if (existingGoogleUser) {
            return res.status(409).json({ error: "This Google account is already registered. Log in with it directly." });
          }

          authProviders.push({
            provider: "google",
            providerId: googlePayload.sub,
            verifiedAt: new Date()
          });
        }
      } catch (err) {
        return res.status(401).json({ error: "Invalid or expired google registration token" });
      }
    }

    user = await User.create({
      name,
      phone: verifiedPhone,
      role,
      isVerified: true,
      authProviders
    });

    const { accessToken, refreshToken } = await generateTokens(user._id.toString());

    res.cookie("refreshToken", refreshToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ 
      success: true, 
      message: "User registered", 
      accessToken,
      user: { name: user.name, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Invalid request" });
  }
});

// Endpoint: /api/auth/refresh
authRouter.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: "Missing refresh token" });
    }

    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const storedToken = await RefreshToken.findOne({ tokenHash, isRevoked: false });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    // Rotate: Revoke the old token
    storedToken.isRevoked = true;
    await storedToken.save();

    // Issue new tokens
    const user = await User.findById(storedToken.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(storedToken.userId.toString());

    res.cookie("refreshToken", newRefreshToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ 
      success: true, 
      accessToken,
      user: { name: user.name, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Invalid request" });
  }
});

// Endpoint: /api/auth/logout
authRouter.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
      await RefreshToken.updateOne({ tokenHash }, { isRevoked: true });
    }
    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
    res.json({ success: true, message: "Logged out" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Invalid request" });
  }
});
