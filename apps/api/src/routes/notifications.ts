import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { Notification } from "../models/Notification";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

// Get all notifications for the logged-in user
notificationsRouter.get("/", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 }) // newest first
      .exec();

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark all notifications as read
notificationsRouter.put("/mark-read", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await Notification.updateMany({ userId, read: false }, { read: true });

    res.json({ success: true, message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

// Mark a single notification as read
notificationsRouter.put("/:id/read", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
});
