'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function RescheduleResponsePage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading: authLoading } = useAuth();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

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

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await api.patch(`/bookings/${params.id}/respond-reschedule`, { accept: true });
      if (res.data?.accepted) {
        setAccepted(true);
        setTimeout(() => {
          router.push(`/barber/bookings/${params.id}/reschedule-confirmed`);
        }, 1000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to accept');
      setAccepting(false);
    }
  };

  const handleSuggestDifferent = async () => {
    try {
      await api.patch(`/bookings/${params.id}/respond-reschedule`, { accept: false });
    } catch (err) {
      // Even if this fails, still navigate
    }
    router.push(`/barber/bookings/${params.id}/propose-time`);
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

  const proposer = booking.proposedBy === 'client' ? booking.client : booking.barber;
  const proposerName = proposer?.name || 'Your client';

  const proposedDate = booking.proposedDate
    ? new Date(booking.proposedDate).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
      })
    : '';

  return (
    <div className="min-h-screen bg-background text-on-background pb-32">
      <header className="w-full top-0 sticky z-50 bg-surface/80 backdrop-blur-sm flex justify-between items-center px-5 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="material-symbols-outlined text-gray-900 cursor-pointer active:scale-95 transition-transform">
            arrow_back
          </button>
          <h1 className="font-semibold text-xl text-primary">Reschedule Proposal</h1>
        </div>
      </header>

      <main className="max-w-[1120px] mx-auto px-5 pt-6 space-y-8">
        <section className="bg-white rounded-xl p-4 shadow-[0px_6px_16px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100">
            {proposer?.profileImage ? (
              <img src={proposer.profileImage} alt={proposerName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-400 text-3xl">person</span>
              </div>
            )}
          </div>
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <h2 className="font-semibold text-xl text-gray-900">{proposerName}</h2>
            </div>
            <p className="text-gray-500 text-sm">{booking.serviceName}</p>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-widest">Proposed New Time</h3>
          <div className="bg-[#FFF1F2] border border-[#FFCCD1] rounded-xl p-6 shadow-[0px_6px_16px_rgba(0,0,0,0.08)] relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="bg-primary p-3 rounded-lg text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px]">event_repeat</span>
              </div>
              <div>
                <p className="font-semibold text-xl text-primary">{proposedDate}</p>
                <p className="font-semibold text-2xl text-gray-900 mt-1">{booking.proposedTimeSlot}</p>
                <div className="flex items-center gap-2 mt-3 text-primary/70">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  <span className="text-sm">60 minute session</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {booking.proposedMessage && (
          <section className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-widest">
              {booking.proposedBy === 'client' ? "Client's Note" : "Barber's Note"}
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-primary italic text-gray-500 text-base">
              &quot;{booking.proposedMessage}&quot;
            </div>
          </section>
        )}

        <div className="flex items-center gap-3 bg-gray-100/50 p-3 rounded-lg">
          <span className="material-symbols-outlined text-gray-400">info</span>
          <p className="text-sm text-gray-500">The appointment isn't confirmed until you accept the new time.</p>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-surface border-t border-gray-200 p-5 z-40">
        <div className="max-w-[1120px] mx-auto flex flex-col gap-3">
          <button
            onClick={handleAccept}
            disabled={accepting || accepted}
            className={`w-full font-semibold text-sm py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex justify-center items-center gap-2 ${
              accepted
                ? "bg-green-600 text-white"
                : "bg-primary hover:bg-primary/90 text-white"
            }`}
          >
            {accepting ? (
              <>
                <span className="material-symbols-outlined animate-spin">sync</span>
                Processing...
              </>
            ) : accepted ? (
              <>
                <span className="material-symbols-outlined">check_circle</span>
                Accepted
              </>
            ) : (
              'Accept New Time'
            )}
          </button>
          <button
            onClick={handleSuggestDifferent}
            disabled={accepting || accepted}
            className="w-full bg-transparent border border-gray-300 text-gray-900 font-semibold text-sm py-4 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
          >
            Suggest Different Time
          </button>
        </div>
      </div>
    </div>
  );
}
