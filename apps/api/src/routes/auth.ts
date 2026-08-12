import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { 
  sendOtpSchema, 
  verifyOtpSchema, 
  googleAuthSchema, 
  registerSchema,
  GOOGLE_USER_FALLBACK_NAME
} from "@kinyozihub/types";
import { generateAndStoreOtp, verifyStoredOtp, getOtpProvider } from "../services/otp.service";
import { User } from "../models/User";
import { RefreshToken } from "../models/RefreshToken";
import { Shop } from "../models/Shop";
import { BarberProfile } from "../models/BarberProfile";

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
    let user = await User.findOne({ 
      authProviders: { $elemMatch: { provider: "google", providerId: sub } } 
    });

    if (!user) {
      // 3. New user: create account immediately
      user = await User.create({
        name: name || GOOGLE_USER_FALLBACK_NAME,
        email: email,
        phone: `google_${sub}`,
        role: "client", // Default role
        isVerified: false,
        authProviders: [{
          provider: "google",
          providerId: sub,
          verifiedAt: new Date()
        }]
      });
    }

    // 4. Login flow
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
      isNewUser: false, // from the frontend's perspective, they are fully logged in
      accessToken,
      user: { _id: user._id.toString(), name: user.name, role: user.role, phone: user.phone }
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Invalid request or token verification failed" });
  }
});

// Endpoint: /api/auth/complete-onboarding
authRouter.post("/complete-onboarding", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing token" });
    }
    const token = authHeader.split(" ")[1];

    let verifiedPayload: any;
    try {
      verifiedPayload = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const userId = verifiedPayload.userId;
    if (!userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    const { phone, role, name } = req.body;
    if (!phone || !/^\+254\d{9}$/.test(phone)) {
      return res.status(400).json({ error: "Please enter a valid Safaricom/Airtel number" });
    }

    // Validate role
    if (role && !['client', 'barber', 'shop_owner'].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Check if phone is already used by another user
    const existingUser = await User.findOne({ phone, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ error: "Phone number already in use" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name && typeof name === 'string' && name.trim().length > 0) {
      user.name = name.trim();
    }
    user.phone = phone;
    if (role) {
      user.role = role;
    }
    // Keep isVerified false for now, since we aren't doing OTP
    user.isVerified = false; 

    // Add or update the phone provider in authProviders
    const phoneProviderIndex = user.authProviders.findIndex((ap: any) => ap.provider === "phone");
    if (phoneProviderIndex >= 0) {
      user.authProviders[phoneProviderIndex].providerId = phone;
    } else {
      user.authProviders.push({ provider: "phone", providerId: phone, verifiedAt: new Date().toISOString() });
    }

    await user.save();

    // If role changed to shop_owner, create a default Shop if none exists
    if (user.role === 'shop_owner') {
      let shop = await Shop.findOne({ ownerId: user._id });
      if (!shop) {
        await Shop.create({
          ownerId: user._id,
          name: `${user.name}'s Shop`,
          location: { type: 'Point', coordinates: [36.8219, -1.2921] }, // Default Nairobi
          areaName: 'Nairobi',
          subscriptionTier: 'free'
        });
      }
    }

    // TODO: Barber-to-shop association flow not implemented — currently requires manual DB fix.
    // If role changed to barber, create a default BarberProfile if none exists
    if (user.role === 'barber') {
      let profile = await BarberProfile.findOne({ user: user._id });
      if (!profile) {
        await BarberProfile.create({
          user: user._id,
          shopName: `${user.name}'s Barbershop`,
          isVerified: false,
          rating: 0,
          reviewCount: 0,
          priceRange: "KES 500 - 1500",
          distanceString: "0 km",
          nextAvailable: "Now",
          profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
          tier: 'free',
          commissionRate: 0.10,
          isSponsored: false,
          portfolioImages: []
        });
      }
    }

    res.json({ success: true, user: { _id: user._id.toString(), name: user.name, role: user.role, phone: user.phone } });
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
      user: { _id: user._id.toString(), name: user.name, role: user.role, phone: user.phone }
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
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ error: "Failed to log out" });
  }
});

// Endpoint: PUT /api/auth/me
// Update core profile fields (currently name)
authRouter.put("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing token" });
    }
    const token = authHeader.split(" ")[1];

    let verifiedPayload: any;
    try {
      verifiedPayload = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const userId = verifiedPayload.userId;
    if (!userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    const { name } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: "Display name is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.name = name.trim();
    await user.save();

    return res.json({ success: true, data: { _id: user._id.toString(), name: user.name, phone: user.phone, role: user.role } });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

// Endpoint: GET /api/auth/settings
authRouter.get("/settings", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing token" });
    }
    const token = authHeader.split(" ")[1];

    let verifiedPayload: any;
    try {
      verifiedPayload = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const userId = verifiedPayload.userId;
    if (!userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ success: true, data: user.preferences });
  } catch (error) {
    console.error("Get settings error:", error);
    return res.status(500).json({ error: "Failed to get settings" });
  }
});

// Endpoint: PUT /api/auth/settings
authRouter.put("/settings", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing token" });
    }
    const token = authHeader.split(" ")[1];

    let verifiedPayload: any;
    try {
      verifiedPayload = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const userId = verifiedPayload.userId;
    if (!userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    const { preferences } = req.body;
    
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: "Preferences object is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.preferences = { ...user.preferences, ...preferences };
    await user.save();

    return res.json({ success: true, data: user.preferences });
  } catch (error) {
    console.error("Update settings error:", error);
    return res.status(500).json({ error: "Failed to update settings" });
  }
});
