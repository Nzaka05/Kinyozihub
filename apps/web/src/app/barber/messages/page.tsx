"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type Participant = {
  _id: string;
  name: string;
  profileImage?: string;
  role: string;
};

type BookingRef = {
  _id: string;
  serviceName: string;
  date: string;
  timeSlot: string;
  status: string;
};

type Conversation = {
  _id: string;
  participants: Participant[];
  conversationType: 'booking' | 'staff';
  bookingId?: BookingRef;
  lastMessage?: string;
  lastMessageAt?: string;
  isUnread: boolean;
};

export default function BarberMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  const fetchConversations = async () => {
    try {
      const res = await api.get("/conversations");
      if (res.data?.success) {
        setConversations(res.data.data);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Poll every 5 seconds
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  const getOtherParticipant = (conv: Conversation): Participant | undefined => {
    return conv.participants.find((p) => p._id !== user?._id);
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Messages</h1>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading conversations...</div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-xl border border-border">
          <span className="material-symbols-outlined text-[48px] text-gray-300 mb-4 block">chat</span>
          <p className="font-medium text-gray-600 mb-1">No messages yet</p>
          <p className="text-sm">When clients message you about bookings, they&apos;ll appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const other = getOtherParticipant(conv);
            return (
              <div
                key={conv._id}
                onClick={() => router.push(`/barber/messages/${conv._id}`)}
                className={`bg-white rounded-lg border p-4 cursor-pointer hover:border-gray-300 transition-colors flex items-center gap-4 ${
                  conv.isUnread ? "border-primary/40 bg-primary/[0.02]" : "border-gray-200"
                }`}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                  {other?.profileImage ? (
                    <img src={other.profileImage} alt={other.name} className="w-full h-full object-cover" />
                  ) : (
                    other?.name?.charAt(0).toUpperCase() || "?"
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h3 className={`truncate ${conv.isUnread ? "font-bold text-gray-900" : "font-medium text-gray-900"}`}>
                      {other?.name || "Unknown"}
                    </h3>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                    {conv.conversationType === "staff" ? (
                      <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase">
                        {other?.role === "shop_owner" ? "Shop Owner" : other?.role === "barber" ? "Barber" : "Staff"}
                      </span>
                    ) : (
                      <>{conv.bookingId?.serviceName} • {conv.bookingId?.timeSlot}</>
                    )}
                  </p>
                  <p className={`text-sm truncate ${conv.isUnread ? "font-semibold text-gray-800" : "text-gray-500"}`}>
                    {conv.lastMessage || "No messages yet"}
                  </p>
                </div>

                {/* Unread dot */}
                {conv.isUnread && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0"></div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
