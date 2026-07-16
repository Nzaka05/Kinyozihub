'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BarberOverview {
  _id: string;
  user: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  rating: number;
  reviewCount: number;
  todayBookings: number;
  weeklyEarnings: number;
}

interface Booking {
  _id: string;
  client: { name: string; profileImage?: string };
  barber: { name: string; profileImage?: string };
  service: { name: string; duration: number };
  date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
}

interface DashboardData {
  shop: any;
  barbersOverview: BarberOverview[];
  combinedBookings: Booking[];
  stats: {
    todayBookings: number;
    weeklyEarnings: number;
    activeBarbers: number;
  };
}

export default function ShopDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [messagingBarberId, setMessagingBarberId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    console.log('shop dashboard effect fired, authLoading:', authLoading);
    if (authLoading) return; // Wait for AuthContext to finish its initial check
    
    console.log('shop dashboard proceeding to fetch...');
    const fetchDashboard = async () => {
      try {
        console.log('shop dashboard making API call to /shops/me/dashboard');
        const response = await api.get('/shops/me/dashboard');
        console.log('shop dashboard response received:', response.data);
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError(response.data.message || 'Failed to load dashboard');
        }
      } catch (err: any) {
        console.error('shop dashboard fetch error:', err);
        setError(err.response?.data?.error || err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [authLoading]);

  const handleGenerateCode = async () => {
    if (isGeneratingCode) return;
    setIsGeneratingCode(true);
    try {
      const response = await api.post('/shops/me/invite-code');
      if (response.data.success && data) {
        setData({
          ...data,
          shop: {
            ...data.shop,
            inviteCode: response.data.inviteCode
          }
        });
      }
    } catch (err) {
      console.error('Failed to generate invite code:', err);
      alert('Failed to generate invite code. Please try again.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCopyCode = async () => {
    if (data?.shop?.inviteCode) {
      try {
        await navigator.clipboard.writeText(data.shop.inviteCode);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  const handleMessageBarber = async (barberUserId: string) => {
    setMessagingBarberId(barberUserId);
    try {
      const res = await api.post('/conversations/initiate', { type: 'staff', targetUserId: barberUserId });
      if (res.data?.success) {
        router.push(`/shop/messages/${res.data.data._id}`);
      }
    } catch (err) {
      console.error('Failed to initiate message:', err);
      alert('Failed to initiate conversation');
    } finally {
      setMessagingBarberId(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-error">{error}</div>;
  }

  const shopName = data?.shop?.name || 'My Shop';
  const ownerName = user?.name || 'Shop Owner';

  return (
    <>
          <div className="max-w-[1120px] mx-auto space-y-xl">
            {/* Page Header */}
            <div>
              <h2 className="font-headline-lg text-2xl md:text-headline-lg text-on-surface mb-1">Good morning, {ownerName.split(' ')[0]}</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">Here is what's happening at {shopName} today.</p>
            </div>

            {/* SECTION 1: Stat Strip */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-lg">
              <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-variant shadow-[0px_6px_16px_rgba(0,0,0,0.03)] hover:shadow-[0px_6px_16px_rgba(0,0,0,0.08)] transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Today's Bookings</p>
                  <span className="material-symbols-outlined text-primary bg-primary-fixed p-1 rounded-full text-[18px]">calendar_today</span>
                </div>
                <p className="font-headline-lg text-headline-lg text-on-surface">{data?.stats?.todayBookings || 0}</p>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-variant shadow-[0px_6px_16px_rgba(0,0,0,0.03)] hover:shadow-[0px_6px_16px_rgba(0,0,0,0.08)] transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Weekly Earnings</p>
                  <span className="material-symbols-outlined text-tertiary bg-tertiary-fixed p-1 rounded-full text-[18px]">payments</span>
                </div>
                <p className="font-headline-lg text-headline-lg text-on-surface">KES {(data?.stats?.weeklyEarnings || 0).toLocaleString()}</p>
                <p className="font-body-sm text-[12px] text-on-surface-variant mt-1">Combined across all staff</p>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-variant shadow-[0px_6px_16px_rgba(0,0,0,0.03)] hover:shadow-[0px_6px_16px_rgba(0,0,0,0.08)] transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Active Barbers</p>
                  <span className="material-symbols-outlined text-secondary bg-secondary-fixed p-1 rounded-full text-[18px]">group</span>
                </div>
                <p className="font-headline-lg text-headline-lg text-on-surface">{data?.stats?.activeBarbers || 0}</p>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-variant shadow-[0px_6px_16px_rgba(0,0,0,0.03)] hover:shadow-[0px_6px_16px_rgba(0,0,0,0.08)] transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Shop Invite Code</p>
                    <span className="material-symbols-outlined text-on-surface bg-surface-variant p-1 rounded-full text-[18px]">key</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-headline-lg text-headline-lg text-on-surface font-mono tracking-wider">
                      {data?.shop?.inviteCode || '------'}
                    </p>
                    {data?.shop?.inviteCode && (
                      <button
                        onClick={handleCopyCode}
                        className={`transition-colors flex items-center p-1.5 rounded-md ${isCopied ? 'text-green-600 bg-green-50' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
                        title="Copy to clipboard"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {isCopied ? 'check' : 'content_copy'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
                <button 
                  onClick={handleGenerateCode}
                  disabled={isGeneratingCode}
                  className="mt-2 text-primary font-label-md text-label-md hover:underline text-left self-start"
                >
                  {isGeneratingCode ? 'Generating...' : data?.shop?.inviteCode ? 'Rotate Code' : 'Generate Code'}
                </button>
              </div>
            </section>

            {/* SECTION 2: Barbers Overview */}
            <section>
              <div className="flex justify-between items-end mb-4">
                <h3 className="font-headline-md text-headline-md text-on-surface">Barbers Overview</h3>
                <Link href="#" className="font-label-bold text-label-bold text-primary hover:underline">View all</Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data?.barbersOverview.map((barber) => (
                  <div key={barber._id} className="bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden group">
                    <div className="h-24 bg-surface-variant relative">
                      <div className="absolute -bottom-6 left-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full border-4 border-surface-container-lowest overflow-hidden bg-surface">
                            <img 
                              className="w-full h-full object-cover" 
                              alt={barber.user?.name} 
                              src={barber.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(barber.user?.name || 'B')}&background=random`} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-8 p-4">
                      <h4 className="font-label-bold text-label-bold text-on-surface text-[16px]">{barber.user?.name}</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mb-4 flex items-center gap-1">
                        <span className="material-symbols-outlined text-yellow-500 text-[14px] icon-filled">star</span>
                        {barber.rating} ({barber.reviewCount} reviews)
                      </p>
                      <div className="grid grid-cols-2 gap-2 mb-4 bg-surface-container p-2 rounded-lg">
                        <div>
                          <p className="text-[11px] text-on-surface-variant uppercase tracking-wider">Today</p>
                          <p className="font-label-bold text-label-bold">{barber.todayBookings} Bookings</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-on-surface-variant uppercase tracking-wider">Week</p>
                          <p className="font-label-bold text-label-bold">KES {barber.weeklyEarnings.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 py-2 border border-outline-variant text-on-surface rounded-lg font-label-bold text-label-bold hover:bg-surface-variant transition-colors">
                          View Profile
                        </button>
                        <button 
                          onClick={() => handleMessageBarber(barber.user?._id)}
                          disabled={messagingBarberId === barber.user?._id}
                          className="flex-1 py-2 bg-primary text-on-primary rounded-lg font-label-bold text-label-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
                        >
                          {messagingBarberId === barber.user?._id ? "..." : (
                            <>
                              <span className="material-symbols-outlined text-[18px]">chat</span>
                              Message
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Barber Card */}
                <div className="bg-surface-container border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center p-4 min-h-[280px] cursor-not-allowed opacity-70 group">
                  <div className="w-12 h-12 rounded-full bg-surface-container-lowest flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-primary">add</span>
                  </div>
                  <p className="font-label-bold text-label-bold text-on-surface">Add New Barber</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-center mt-1">Feature not built yet / out of scope.</p>
                </div>
              </div>
            </section>

            {/* SECTION 3: Combined Bookings Today */}
            <section className="space-y-4 pb-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
                <h3 className="font-headline-md text-headline-md text-on-surface">Combined Bookings Today</h3>
              </div>
              
              <div className="bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-surface-variant">
                        <th className="p-4 font-label-bold text-on-surface-variant uppercase tracking-wider text-[11px]">Barber</th>
                        <th className="p-4 font-label-bold text-on-surface-variant uppercase tracking-wider text-[11px]">Client</th>
                        <th className="p-4 font-label-bold text-on-surface-variant uppercase tracking-wider text-[11px]">Time</th>
                        <th className="p-4 font-label-bold text-on-surface-variant uppercase tracking-wider text-[11px]">Status</th>
                        <th className="p-4 font-label-bold text-on-surface-variant uppercase tracking-wider text-[11px]">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-variant">
                      {data?.combinedBookings.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-on-surface-variant">No bookings today.</td>
                        </tr>
                      ) : (
                        data?.combinedBookings.map((booking) => {
                          const statusColors: any = {
                            pending: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
                            confirmed: 'bg-secondary-fixed text-on-secondary-fixed-variant',
                            completed: 'bg-surface-variant text-on-surface-variant',
                            cancelled: 'bg-error-container text-on-error-container',
                          };
                          
                          return (
                            <tr key={booking._id} className="hover:bg-surface-container-low transition-colors">
                              <td className="p-4 flex items-center gap-3">
                                <img 
                                  src={booking.barber?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.barber?.name || 'B')}&background=random`} 
                                  className="w-8 h-8 rounded-full object-cover" 
                                  alt={booking.barber?.name} 
                                />
                                <span className="font-label-bold">{booking.barber?.name}</span>
                              </td>
                              <td className="p-4">{booking.client?.name || 'Guest'}</td>
                              <td className="p-4">{new Date(booking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-[12px] font-label-bold ${statusColors[booking.status] || statusColors.pending} capitalize`}>
                                  {booking.status}
                                </span>
                              </td>
                              <td className="p-4">KES {booking.price}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

          </div>
    </>
  );
}
