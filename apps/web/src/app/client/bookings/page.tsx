'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@kinyozihub/ui/src/button';
import Image from 'next/image';
import ClientDrawer from '@/components/ClientDrawer';

interface Booking {
  _id: string;
  serviceName: string;
  price: number;
  date: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reviewLeft?: boolean;
  barber: {
    name: string;
    profileImage?: string;
  };
}

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isLoading: authLoading } = useAuth();
  const router = useRouter();

  const handleMessage = async (bookingId: string) => {
    try {
      const res = await api.post('/conversations/initiate', { bookingId });
      if (res.data?.success) {
        router.push(`/client/messages/${res.data.data._id}`);
      }
    } catch (error) {
      console.error('Failed to initiate conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchBookings();
    }
  }, [authLoading]);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings');
      if (response.data?.success) {
        setBookings(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch bookings", error);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();

  const upcomingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  const isWithinTwoHours = (dateString: string) => {
    const bookingDate = new Date(dateString);
    const diffInHours = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffInHours > 0 && diffInHours <= 2;
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading bookings...</div>;
  }

  return (
    <>
      <header className="bg-white w-full top-0 sticky z-50">
        <div className="flex justify-between items-center px-5 py-4 bg-white">
          <button onClick={() => setIsDrawerOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-primary active:scale-95 transition-transform">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>menu</span>
          </button>
          <h1 className="text-xl font-semibold text-textPrimary absolute left-1/2 -translate-x-1/2">
            My Bookings
          </h1>
          <div className="w-10"></div>
        </div>
        <div className="px-5 pt-2 border-b border-border">
          <div className="flex gap-8 relative">
            <button 
              className={`pb-3 relative font-semibold ${activeTab === 'upcoming' ? 'text-textPrimary' : 'text-gray-500 hover:text-textPrimary transition-colors'}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming
              <div className={`absolute bottom-0 left-0 w-full h-0.5 ${activeTab === 'upcoming' ? 'bg-primary' : 'bg-transparent'}`}></div>
            </button>
            <button 
              className={`pb-3 relative font-semibold ${activeTab === 'past' ? 'text-textPrimary' : 'text-gray-500 hover:text-textPrimary transition-colors'}`}
              onClick={() => setActiveTab('past')}
            >
              Past
              <div className={`absolute bottom-0 left-0 w-full h-0.5 ${activeTab === 'past' ? 'bg-primary' : 'bg-transparent'}`}></div>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full max-w-[1120px] mx-auto px-5 py-6">
        {activeTab === 'upcoming' && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-10 text-gray-500">No upcoming bookings.</div>
            ) : (
              upcomingBookings.map((booking) => {
                const bookingDate = new Date(booking.date);
                const dateDisplay = bookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const cannotCancel = isWithinTwoHours(booking.date);

                return (
                  <div key={booking._id} className="bg-white rounded-2xl p-4 flex flex-col gap-3 shadow-[0px_6px_16px_rgba(0,0,0,0.08)] border border-border">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-24 rounded-xl overflow-hidden flex-shrink-0 relative bg-gray-200">
                        {booking.barber.profileImage && (
                          <img className="w-full h-full object-cover" src={booking.barber.profileImage} alt={booking.barber.name} />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col pt-1">
                        <div className="mb-1">
                          {booking.status === 'confirmed' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary/10 text-secondary font-semibold text-xs">
                              Confirmed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-semibold text-xs">
                              Pending Approval
                            </span>
                          )}
                        </div>
                        <h2 className="text-lg font-semibold text-textPrimary mb-0.5">{booking.barber.name}</h2>
                        <p className="text-sm text-gray-500 mb-2">{booking.serviceName}</p>
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                          <span className="text-sm">{dateDisplay} • {booking.timeSlot}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-border pt-3 mt-1 flex justify-between items-center">
                      <div className="flex flex-col">
                        <button 
                          className={`text-sm font-semibold underline-offset-4 transition-colors ${cannotCancel ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-textPrimary hover:underline'}`}
                          disabled={cannotCancel}
                        >
                          {booking.status === 'pending' ? 'Cancel Request' : 'Cancel Booking'}
                        </button>
                        {cannotCancel && (
                          <span className="text-[10px] text-primary mt-1">Cannot cancel within 2 hrs</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMessage(booking._id); }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">chat</span>
                          Message
                        </button>
                        <Button variant="outline" size="sm" className="rounded-xl font-semibold">
                          Reschedule
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'past' && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {pastBookings.length === 0 ? (
              <div className="text-center py-10 text-gray-500">No past bookings.</div>
            ) : (
              pastBookings.map((booking) => {
                const bookingDate = new Date(booking.date);
                const dateDisplay = bookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return (
                  <div key={booking._id} className="bg-white rounded-2xl p-4 flex flex-col gap-3 border border-border relative overflow-hidden">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-24 rounded-xl overflow-hidden flex-shrink-0 relative bg-gray-200 grayscale opacity-80">
                         {booking.barber.profileImage && (
                          <img className="w-full h-full object-cover" src={booking.barber.profileImage} alt={booking.barber.name} />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col pt-1">
                        <div className="mb-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-semibold text-xs">
                            {booking.status === 'completed' ? 'Completed' : 'Cancelled'}
                          </span>
                        </div>
                        <h2 className="text-lg font-semibold text-textPrimary mb-0.5">{booking.barber.name}</h2>
                        <p className="text-sm text-gray-500 mb-2">{booking.serviceName}</p>
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <span className="material-symbols-outlined text-[16px]">history</span>
                          <span className="text-sm">{dateDisplay} • {booking.timeSlot}</span>
                        </div>
                      </div>
                    </div>
                    {booking.status === 'completed' && !booking.reviewLeft && (
                       <div className="border-t border-border pt-3 mt-1">
                        <Button className="w-full rounded-xl" size="lg" onClick={(e) => { e.stopPropagation(); router.push(`/client/bookings/${booking._id}/review`); }}>
                          Leave a Review
                        </Button>
                      </div>
                    )}
                    {booking.status === 'completed' && booking.reviewLeft && (
                       <div className="border-t border-border pt-3 mt-1 text-center text-sm font-semibold text-gray-500">
                        Review submitted
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Rebook CTA Area */}
            <div className="mt-4 p-6 bg-gray-50 rounded-2xl text-center border border-border">
              <div className="w-12 h-12 rounded-full bg-white mx-auto mb-3 flex items-center justify-center border border-border">
                <span className="material-symbols-outlined text-textPrimary">content_cut</span>
              </div>
              <h3 className="text-xl font-semibold text-textPrimary mb-2">Time for a fresh cut?</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-[250px] mx-auto">It's been a few weeks since your last visit. Find an open slot today.</p>
              <Button className="w-full rounded-xl" size="lg">
                Find a Barber
              </Button>
            </div>
          </div>
        )}
      </div>

      <ClientDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
