import { Router } from "express";
import { v2 as cloudinary } from "cloudinary";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// GET /uploads/cloudinary-signature
router.get("/cloudinary-signature", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({ error: "Cloudinary credentials not configured" });
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = `kinyozihub/portfolios/${userId}`;

    const signature = cloudinary.utils.api_sign_request(
      {
        folder,
        timestamp
      },
      apiSecret
    );

    res.json({
      success: true,
      data: {
        signature,
        timestamp,
        apiKey,
        cloudName,
        folder
      }
    });
  } catch (error) {
    console.error("Error generating cloudinary signature:", error);
    res.status(500).json({ error: "Failed to generate upload signature" });
  }
});

export const uploadsRouter = router;
