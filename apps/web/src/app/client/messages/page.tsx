"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import ClientDrawer from "@/components/ClientDrawer";

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

export default function ClientMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
    <>
      <header className="bg-white w-full top-0 sticky z-50">
        <div className="flex justify-between items-center px-5 py-4 bg-white">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-primary active:scale-95"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>menu</span>
          </button>
          <h1 className="text-xl font-semibold text-textPrimary absolute left-1/2 -translate-x-1/2">
            Messages
          </h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="flex-1 w-full max-w-[1120px] mx-auto px-5 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-xl border border-border">
            <span className="material-symbols-outlined text-[48px] text-gray-300 mb-4 block">chat</span>
            <p className="font-medium text-gray-600 mb-1">No messages yet</p>
            <p className="text-sm">Start a conversation from your booking details.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              return (
                <div
                  key={conv._id}
                  onClick={() => router.push(`/client/messages/${conv._id}`)}
                  className={`bg-white rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all flex items-center gap-4 shadow-[0px_6px_16px_rgba(0,0,0,0.08)] border ${
                    conv.isUnread ? "border-primary/40" : "border-border"
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
                      <h3 className={`truncate ${conv.isUnread ? "font-bold text-textPrimary" : "font-medium text-textPrimary"}`}>
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

      <ClientDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
