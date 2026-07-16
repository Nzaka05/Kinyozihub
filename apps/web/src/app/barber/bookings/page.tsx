"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type Booking = {
  _id: string;
  serviceName: string;
  date: string;
  timeSlot: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  client?: {
    _id: string;
    name: string;
    profileImage?: string;
    phone?: string;
  };
};

export default function BarberBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  const handleMessage = async (bookingId: string) => {
    try {
      const res = await api.post("/conversations/initiate", { bookingId });
      if (res.data?.success) {
        router.push(`/barber/messages/${res.data.data._id}`);
      }
    } catch (error) {
      console.error("Failed to initiate conversation:", error);
      alert("Failed to start conversation. Please try again.");
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get("/bookings");
      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: "confirmed" | "cancelled") => {
    try {
      const res = await api.patch(`/bookings/${bookingId}/status`, { status });
      if (res.data.success) {
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: res.data.data.status } : b));
      }
    } catch (error) {
      console.error(`Failed to update booking to ${status}:`, error);
      alert(`Failed to update booking status. Please try again.`);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === "all") return true;
    return b.status === filter;
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Appointments</h1>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {["all", "pending", "confirmed", "cancelled"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap capitalize ${
              filter === f 
                ? "bg-black text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          No bookings found for the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(booking => (
            <div 
              key={booking._id} 
              className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 cursor-pointer hover:border-gray-300 transition-colors"
              onClick={() => setExpandedId(expandedId === booking._id ? null : booking._id)}
            >
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Client Avatar */}
              <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-500 font-medium">
                {booking.client?.profileImage ? (
                  <img src={booking.client.profileImage} alt={booking.client.name} className="w-full h-full object-cover" />
                ) : (
                  booking.client?.name?.charAt(0).toUpperCase() || "?"
                )}
              </div>

              {/* Booking Details */}
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900">{booking.client?.name || "Unknown Client"}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                    booking.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    booking.status === "confirmed" ? "bg-green-100 text-green-800" :
                    booking.status === "cancelled" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {booking.status}
                  </span>
                </div>
                <p className="text-gray-900 mb-1">{booking.serviceName}</p>
                <div className="flex items-center text-sm text-gray-500 gap-4">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    {new Date(booking.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    {booking.timeSlot}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {booking.status === "pending" && (
                <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                  <button 
                    onClick={() => handleUpdateStatus(booking._id, "confirmed")}
                    className="flex-1 sm:flex-none bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(booking._id, "cancelled")}
                    className="flex-1 sm:flex-none bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              )}
              </div>

              {/* Expanded Details */}
              {expandedId === booking._id && (
                <div 
                  className="w-full mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2 text-sm text-gray-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between max-w-sm">
                    <span className="text-gray-500">Phone Number</span>
                    <span className="font-medium text-gray-900">{booking.client?.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between max-w-sm">
                    <span className="text-gray-500">Service</span>
                    <span className="font-medium">{booking.serviceName}</span>
                  </div>
                  <div className="flex justify-between max-w-sm">
                    <span className="text-gray-500">Status</span>
                    <span className="capitalize font-medium">{booking.status}</span>
                  </div>
                  <button
                    onClick={() => handleMessage(booking._id)}
                    className="mt-3 flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors max-w-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                    Message Client
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
