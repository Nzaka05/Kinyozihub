"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type Notification = {
  _id: string;
  type: "booking" | "message" | "review" | "system";
  title: string;
  message: string;
  relatedId?: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<any>(null);
  const [expanding, setExpanding] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get("/notifications");
        if (response.data.success) {
          setNotifications(response.data.data);
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/mark-read");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (expandedId === notif._id) {
      setExpandedId(null);
      return;
    }
    
    if (!notif.read) {
      handleMarkRead(notif._id);
    }

    setExpandedId(notif._id);
    setExpandedData(null);

    if (notif.type === "booking" && notif.relatedId) {
      setExpanding(true);
      try {
        const res = await api.get(`/bookings/${notif.relatedId}`);
        if (res.data.success) {
          setExpandedData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load booking details:", err);
      } finally {
        setExpanding(false);
      }
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "booking": return "calendar_today";
      case "message": return "chat_bubble";
      case "review": return "star";
      case "system": return "info";
      default: return "notifications";
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="flex justify-between items-center h-16 px-6 bg-white border-b border-border shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/barber/dashboard" className="material-symbols-outlined text-gray-700 hover:text-primary transition-colors cursor-pointer">arrow_back</Link>
          <h2 className="text-xl font-black text-gray-900">Notifications</h2>
        </div>
      </header>

      <main className="max-w-md mx-auto w-full pt-16 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">Recent</h1>
          {notifications.some(n => !n.read) && (
            <button 
              onClick={handleMarkAllRead}
              className="text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div 
                key={notif._id}
                className={`flex flex-col gap-4 p-4 rounded-2xl transition-colors ${
                  notif.read ? "bg-white border border-gray-100" : "bg-orange-50/50 border border-orange-100"
                }`}
              >
                <div 
                  className="flex gap-4 cursor-pointer"
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    notif.read ? "bg-gray-100 text-gray-500" : "bg-orange-100 text-orange-600"
                  }`}>
                    <span className="material-symbols-outlined text-xl">{getIconForType(notif.type)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-semibold truncate pr-2 ${notif.read ? "text-gray-900" : "text-gray-900"}`}>
                        {notif.title}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap pt-0.5">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className={`text-sm ${notif.read ? "text-gray-500" : "text-gray-800 font-medium"} line-clamp-2`}>
                      {notif.message}
                    </p>
                  </div>
                  
                  {!notif.read && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-500 mt-2" />
                  )}
                </div>

                {/* Expanded Details */}
                {expandedId === notif._id && notif.type === "booking" && (
                  <div className="mt-2 pt-4 border-t border-gray-200">
                    {expanding ? (
                      <div className="flex justify-center py-4">
                        <div className="w-5 h-5 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
                      </div>
                    ) : expandedData ? (
                      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-800 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Client</span>
                          <span className="font-semibold">{expandedData.client?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Service</span>
                          <span className="font-medium">{expandedData.serviceName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Date & Time</span>
                          <span>{new Date(expandedData.date).toLocaleDateString()} at {expandedData.timeSlot}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status</span>
                          <span className="capitalize font-medium px-2 py-0.5 bg-gray-200 rounded-full text-xs">
                            {expandedData.status}
                          </span>
                        </div>
                        <div className="pt-4 mt-2">
                          <Link href="/barber/bookings" className="block w-full text-center py-2.5 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity active:scale-95">
                            View in Bookings
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-500 bg-gray-50 rounded-xl">
                        Details unavailable (booking may have been deleted).
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <span className="material-symbols-outlined text-3xl">notifications_off</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">You're all caught up</h2>
            <p className="text-gray-500">
              When you get new notifications for bookings or messages, they'll appear here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
