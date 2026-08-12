import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middlewares/requireAuth";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { Booking } from "../models/Booking";
import { User } from "../models/User";
import { Shop } from "../models/Shop";
import { BarberProfile } from "../models/BarberProfile";

export const conversationsRouter = Router();

conversationsRouter.use(requireAuth);

/**
 * POST /api/conversations/initiate
 * Lazy-create or fetch an existing conversation for a specific booking.
 */
conversationsRouter.post("/initiate", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { bookingId, type, targetUserId } = req.body;
    
    // STAFF CONVERSATION LOGIC
    if (type === 'staff') {
      const callerUser = await User.findById(userId);
      if (!callerUser) {
        return res.status(404).json({ error: "User not found" });
      }

      let resolvedTargetUserId = targetUserId;

      // If Barber didn't provide targetUserId, auto-resolve to their shop owner
      if (!resolvedTargetUserId && callerUser.role === 'barber') {
        const profile = await BarberProfile.findOne({ user: callerUser._id });
        if (profile?.shopId) {
          const shop = await Shop.findById(profile.shopId);
          if (shop) resolvedTargetUserId = shop.ownerId.toString();
        }
      }

      if (!resolvedTargetUserId) {
        return res.status(400).json({ error: "targetUserId is required or could not be auto-resolved" });
      }

      const targetUser = await User.findById(resolvedTargetUserId);
      if (!targetUser) {
        return res.status(404).json({ error: "Target User not found" });
      }

      let isValidLink = false;
      if (callerUser.role === 'shop_owner' && targetUser.role === 'barber') {
         const shop = await Shop.findOne({ ownerId: callerUser._id });
         const profile = await BarberProfile.findOne({ user: targetUser._id, shopId: shop?._id });
         if (shop && profile) isValidLink = true;
      } else if (callerUser.role === 'barber' && targetUser.role === 'shop_owner') {
         const profile = await BarberProfile.findOne({ user: callerUser._id });
         const shop = await Shop.findOne({ _id: profile?.shopId, ownerId: targetUser._id });
         if (profile && shop) isValidLink = true;
      }

      if (!isValidLink) {
        return res.status(403).json({ error: "Not authorized to message this staff member" });
      }

      let conversation = await Conversation.findOne({
        conversationType: 'staff',
        participants: { $all: [userId, resolvedTargetUserId] }
      }).populate("participants", "name profileImage role");

      if (!conversation) {
        conversation = await Conversation.create({
          conversationType: 'staff',
          participants: [userId, resolvedTargetUserId]
        });
        await conversation.populate("participants", "name profileImage role");
      }
      return res.json({ success: true, data: conversation });
    }

    // BOOKING CONVERSATION LOGIC
    if (!bookingId) {
      return res.status(400).json({ error: "bookingId is required for booking conversations" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Verify ownership — use .toString() on the ObjectId, not on a populated document
    const clientId = booking.client.toString();
    const barberId = booking.barber.toString();

    if (clientId !== userId && barberId !== userId) {
      return res.status(403).json({ error: "Not authorized for this booking" });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({ bookingId, conversationType: 'booking' })
      .populate("participants", "name profileImage role")
      .populate({
        path: "bookingId",
        select: "serviceName date timeSlot status",
      });

    if (!conversation) {
      conversation = await Conversation.create({
        bookingId,
        conversationType: 'booking',
        participants: [booking.client, booking.barber],
      });
      await conversation.populate("participants", "name profileImage role");
      await conversation.populate({
        path: "bookingId",
        select: "serviceName date timeSlot status",
      });
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error("Error initiating conversation:", error);
    res.status(500).json({ error: "Failed to initiate conversation" });
  }
});

/**
 * GET /api/conversations
 * List all conversations for the logged-in user, sorted by most recent message.
 *
 * Unread logic: a conversation is "unread" if the logged-in user's ID
 * is NOT in conversation.lastMessageReadBy. This is computed per-conversation
 * and returned as a boolean `isUnread` field.
 */
conversationsRouter.get("/", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "name profileImage role")
      .populate({
        path: "bookingId",
        select: "serviceName date timeSlot status",
      })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .lean();

    // Add isUnread flag per conversation
    const result = conversations.map((conv: any) => {
      const readByIds = (conv.lastMessageReadBy || []).map((id: any) =>
        id.toString()
      );
      return {
        ...conv,
        isUnread: conv.lastMessage != null && !readByIds.includes(userId),
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

/**
 * GET /api/conversations/:id/messages
 * Fetch all messages in a conversation (oldest first).
 */
conversationsRouter.get("/:id/messages", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

/**
 * POST /api/conversations/:id/messages
 * Send a message. Validates: non-empty, max 2000 chars.
 */
conversationsRouter.post("/:id/messages", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { content } = req.body;

    // Validation
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ error: "Message content cannot be empty" });
    }
    if (content.trim().length > 2000) {
      return res
        .status(400)
        .json({ error: "Message content exceeds 2000 characters" });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: userId,
      content: content.trim(),
      readBy: [userId], // Sender automatically reads their own message
    });

    // Update conversation summary
    conversation.lastMessage = message.content;
    conversation.lastMessageAt = message.createdAt;
    conversation.lastMessageReadBy = [userId as any];
    await conversation.save();

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

/**
 * POST /api/conversations/:id/read
 * Mark all messages in a conversation as read by the current user.
 */
conversationsRouter.post("/:id/read", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Update conversation-level read tracking
    const readByIds = (conversation.lastMessageReadBy || []).map((id: mongoose.Types.ObjectId) =>
      id.toString()
    );
    if (!readByIds.includes(userId)) {
      conversation.lastMessageReadBy = [
        ...(conversation.lastMessageReadBy || []),
        userId as any,
      ];
      await conversation.save();
    }

    // Bulk-update all unread messages
    await Message.updateMany(
      {
        conversationId: conversation._id,
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking as read:", error);
    res.status(500).json({ error: "Failed to mark as read" });
  }
});
