"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type Message = {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readBy: string[];
  createdAt: string;
};

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

type ConversationDetail = {
  _id: string;
  participants: Participant[];
  conversationType: 'booking' | 'staff';
  bookingId?: BookingRef;
};

export default function ShopChatPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchConversation = async () => {
    try {
      // Fetch all conversations and find this one
      const res = await api.get("/conversations");
      if (res.data?.success) {
        const conv = res.data.data.find((c: any) => c._id === id);
        if (conv) setConversation(conv);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/conversations/${id}/messages`);
      if (res.data?.success) {
        setMessages(res.data.data);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await api.post(`/conversations/${id}/read`);
    } catch (error) {
      // Silent — best-effort
    }
  };

  useEffect(() => {
    fetchConversation();
    fetchMessages().then(() => markAsRead());

    // Poll every 3 seconds while chat is open
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read whenever new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.senderId !== user?._id) {
        markAsRead();
      }
    }
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const res = await api.post(`/conversations/${id}/messages`, { content: trimmed });
      if (res.data?.success) {
        setMessages((prev) => [...prev, res.data.data]);
        setNewMessage("");
        inputRef.current?.focus();
      }
    } catch (error: any) {
      const msg = error?.response?.data?.error || "Failed to send message";
      alert(msg);
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (): Participant | undefined => {
    return conversation?.participants.find((p) => p._id !== user?._id);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const other = getOtherParticipant();

  return (
    <div className="max-w-4xl mx-auto flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/shop/messages")}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors -ml-2"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-gray-500 font-medium flex-shrink-0">
              {other?.profileImage ? (
                <img src={other.profileImage} alt={other.name} className="w-full h-full object-cover" />
              ) : (
                other?.name?.charAt(0).toUpperCase() || "?"
              )}
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 leading-tight">
                {other?.name || "Loading..."}
              </h1>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                {conversation?.conversationType === "staff" ? (
                  <span className="bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0 rounded text-[9px] font-semibold tracking-wide uppercase">Staff</span>
                ) : conversation?.bookingId ? (
                  <>{conversation.bookingId.serviceName} • {new Date(conversation.bookingId.date).toLocaleDateString()}</>
                ) : null}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <span className="material-symbols-outlined text-[40px] mb-2 block">chat_bubble_outline</span>
            <p className="text-sm">No messages yet. Send the first one!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMine = msg.senderId === user?._id;
            const otherId = other?._id;
            // Show "Seen" only on the last message sent by the current user
            const isLastMine = isMine && !messages.slice(index + 1).some(m => m.senderId === user?._id);
            const isSeen = isLastMine && otherId && msg.readBy.includes(otherId);

            return (
              <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] ${!isMine ? "flex items-end gap-2" : ""}`}>
                  {/* Avatar for receiver messages */}
                  {!isMine && (
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 font-medium mb-1">
                      {other?.profileImage ? (
                        <img src={other.profileImage} alt={other.name} className="w-full h-full object-cover" />
                      ) : (
                        other?.name?.charAt(0).toUpperCase() || "?"
                      )}
                    </div>
                  )}
                  <div>
                    {/* Sender name on receiver bubbles */}
                    {!isMine && (
                      <p className="text-[11px] text-gray-400 mb-1 ml-1">{other?.name?.split(" ")[0]}</p>
                    )}
                    <div
                      className={`px-4 py-2.5 rounded-2xl ${
                        isMine
                          ? "bg-gray-900 text-white rounded-br-md"
                          : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : ""}`}>
                        <p className={`text-[10px] ${isMine ? "text-gray-400" : "text-gray-400"}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                        {isSeen && (
                          <span className="text-[10px] text-blue-400 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">done_all</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
        {newMessage.length > 1800 && (
          <p className="text-xs text-orange-500 mt-1 px-4">{2000 - newMessage.length} characters remaining</p>
        )}
      </form>
    </div>
  );
}
