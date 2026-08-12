'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function ProposeTimePage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading: authLoading } = useAuth();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && params.id) {
      fetchBooking();
    }
  }, [authLoading, params.id]);

  const fetchBooking = async () => {
    try {
      const res = await api.get(`/bookings/${params.id}`);
      if (res.data?.success) {
        setBooking(res.data.data);
      } else {
        setError('Booking not found');
      }
    } catch (err: any) {
      setError('Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    return {
      dayStr: d.toLocaleDateString("en-US", { weekday: "short" }),
      dateNum: d.getDate(),
      fullDate: d.toISOString().split('T')[0]
    };
  });

  const timeSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
    "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
    "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
  ];

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    try {
      await api.patch(`/bookings/${params.id}/propose-reschedule`, {
        proposedDate: selectedDate,
        proposedTimeSlot: selectedTime,
        proposedMessage: message || undefined
      });
      router.push(`/barber/bookings`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const otherParty = booking
    ? (user?.role === 'barber' ? booking.client : booking.barber)
    : null;
  const otherPartyName = otherParty?.name || 'them';

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (error || !booking) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error || 'Booking not found'}</p>
        <button onClick={() => router.back()} className="text-primary font-semibold">Go Back</button>
      </div>
    );
  }

  const originalDate = new Date(booking.date).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background text-on-background pb-32">
      <header className="bg-surface w-full top-0 sticky z-50 border-b border-outline-variant">
        <div className="flex justify-between items-center px-5 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="hover:bg-surface-container-low transition-colors active:scale-95 p-1 rounded-full">
              <span className="material-symbols-outlined text-primary">arrow_back</span>
            </button>
            <h1 className="font-semibold text-xl text-primary">Propose a New Time</h1>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 pt-4 space-y-6">
        <section>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-[0px_6px_16px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                {otherParty?.profileImage ? (
                  <img src={otherParty.profileImage} alt={otherPartyName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-gray-400">person</span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">{otherPartyName}</h3>
                <p className="text-sm text-gray-500">{booking.serviceName}</p>
              </div>
              <div className="ml-auto bg-gray-100 px-3 py-1 rounded-full">
                <span className="text-sm text-gray-500 line-through">{originalDate}, {booking.timeSlot}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-red-600">
              <span className="material-symbols-outlined text-[18px]">event_busy</span>
              <span className="text-sm font-semibold">Original request</span>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-sm text-gray-900 px-1">Select New Date</h2>
          <div className="flex overflow-x-auto gap-3 py-1 px-1" style={{ scrollbarWidth: 'none' }}>
            {dates.map((d) => {
              const isSelected = selectedDate === d.fullDate;
              return (
                <button
                  key={d.fullDate}
                  onClick={() => setSelectedDate(d.fullDate)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-xl transition-all active:scale-95 ${
                    isSelected
                      ? "border-2 border-brand-coral bg-brand-coral/5 shadow-sm"
                      : "border border-gray-200 bg-white"
                  }`}
                >
                  <span className={`text-sm ${isSelected ? "text-brand-coral font-bold" : "text-gray-500"}`}>{d.dayStr}</span>
                  <span className={`text-xl font-bold ${isSelected ? "text-brand-coral" : "text-gray-900"}`}>{d.dateNum}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-sm text-gray-900 px-1">Select New Time</h2>
          <div className="grid grid-cols-3 gap-3 px-1">
            {timeSlots.map((slot) => {
              const isSelected = selectedTime === slot;
              return (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  className={`border py-3 rounded-xl text-sm font-semibold transition-colors text-center active:scale-95 ${
                    isSelected
                      ? "bg-brand-coral text-white border-brand-coral"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <label className="font-semibold text-sm text-gray-900 px-1">Optional Message</label>
          <div className="px-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl p-4 text-base focus:ring-2 focus:ring-brand-coral focus:border-transparent outline-none transition-all placeholder:text-gray-400"
              placeholder={`Add a note for ${otherPartyName}`}
              rows={3}
              maxLength={500}
            />
          </div>
        </section>

        <section className="px-1 pt-4 space-y-4">
          <button
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedTime || submitting}
            className="w-full bg-brand-coral disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-lg shadow-[0px_10px_20px_rgba(255,56,92,0.12)] active:scale-95 transition-all"
          >
            {submitting ? 'Sending...' : 'Send Proposal'}
          </button>
          <p className="text-sm text-center text-gray-500 px-6">
            {otherPartyName} will be notified and can accept or suggest another time
          </p>
        </section>
      </main>
    </div>
  );
}
