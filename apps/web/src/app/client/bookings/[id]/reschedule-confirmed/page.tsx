'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function RescheduleConfirmedPage() {
  const router = useRouter();
  const params = useParams();
  const { isLoading: authLoading } = useAuth();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const otherParty = booking.barber;
  const otherPartyName = otherParty?.name || 'your barber';

  const confirmedDate = new Date(booking.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
  const confirmedDateShort = new Date(booking.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col items-center">
      {/* Top App Bar */}
      <header className="w-full top-0 sticky z-40 bg-surface flex justify-between items-center px-5 py-4">
        <div className="flex items-center gap-4">
          <span
            className="material-symbols-outlined text-gray-900 cursor-pointer active:scale-95 transition-transform"
            onClick={() => router.push('/client/bookings')}
          >
            close
          </span>
        </div>
        <h1 className="font-semibold text-2xl text-primary">KinyoziHub</h1>
        <div className="w-8 h-8"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md px-5 pb-32 flex flex-col items-center text-center">
        {/* Success Animation */}
        <div className="mt-8 mb-6" style={{ animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }}>
          <div className="relative flex items-center justify-center">
            <div className="absolute w-24 h-24 bg-green-100 rounded-full animate-ping"></div>
            <div className="relative w-20 h-20 bg-green-600 flex items-center justify-center rounded-full shadow-lg">
              <span className="material-symbols-outlined text-white text-[48px]" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
            </div>
          </div>
        </div>

        <h2
          className="font-semibold text-2xl text-gray-900 mb-2"
          style={{ animation: 'fadeUp 0.6s ease-out both', animationDelay: '0.1s' }}
        >
          Rescheduled!
        </h2>

        <p
          className="text-base text-gray-500 max-w-[280px] mb-8"
          style={{ animation: 'fadeUp 0.6s ease-out both', animationDelay: '0.2s' }}
        >
          Your appointment with <span className="font-semibold text-gray-900">{otherPartyName}</span> is now confirmed for <span className="text-primary font-semibold">{confirmedDateShort} at {booking.timeSlot}</span>.
        </p>

        {/* Summary Card */}
        <div
          className="w-full bg-white rounded-xl p-4 shadow-[0px_6px_16px_rgba(0,0,0,0.06)] border border-gray-100 text-left"
          style={{ animation: 'fadeUp 0.6s ease-out both', animationDelay: '0.3s' }}
        >
          <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-4">Updated Booking Details</h3>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
              {otherParty?.profileImage ? (
                <img src={otherParty.profileImage} alt={otherPartyName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-gray-400 text-2xl">person</span>
                </div>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-xl text-gray-900">{otherPartyName}</h4>
              <p className="text-sm text-gray-500">{booking.serviceName}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
              <p className="text-base text-gray-900">{confirmedDate}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
              <p className="text-base text-gray-900">{booking.timeSlot}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
              <p className="text-base text-gray-900">{booking.barber?.area || "Location not specified"}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="w-full mt-8 space-y-4"
          style={{ animation: 'fadeUp 0.6s ease-out both', animationDelay: '0.4s' }}
        >
          <button
            onClick={() => router.push('/client/bookings')}
            className="w-full h-12 bg-primary text-white font-semibold text-sm rounded-xl shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center"
          >
            View My Bookings
          </button>
          <button
            onClick={() => router.push('/client/dashboard')}
            className="w-full h-12 bg-transparent text-gray-900 font-semibold text-sm rounded-xl border border-gray-200 active:bg-gray-50 transition-colors flex items-center justify-center"
          >
            Back to Home
          </button>
        </div>
      </main>

      <style jsx>{`
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
