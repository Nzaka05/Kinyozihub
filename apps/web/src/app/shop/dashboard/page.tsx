'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface BarberOverview {
  _id: string;
  user: {
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

  useEffect(() => {
    if (authLoading) return; // Wait for AuthContext to finish its initial check

    const fetchDashboard = async () => {
      try {
        const response = await api.get('/shops/me/dashboard');
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError(response.data.message || 'Failed to load dashboard');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [authLoading]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-error">{error}</div>;
  }

  const shopName = data?.shop?.name || 'My Shop';
  const ownerName = user?.name || 'Shop Owner';

  return (
    <div className="bg-background text-on-surface font-body-sm antialiased h-screen overflow-hidden flex">
      {/* SideNavBar */}
      <aside className="h-full w-64 fixed left-0 top-0 bg-surface dark:bg-inverse-surface border-r border-outline-variant shadow-sm z-50 flex flex-col p-md transition-all duration-200 ease-in-out hidden md:flex">
        {/* Branding / Header */}
        <div className="mb-xl">
          <h1 className="font-headline-md text-headline-md font-bold text-primary dark:text-inverse-primary mb-1">{shopName}</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-surface-variant">Free Tier</p>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 flex flex-col gap-xs font-body-lg text-body-lg">
          <Link href="/shop/dashboard" className="flex items-center gap-3 px-4 py-3 bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary rounded-lg font-label-bold transition-all duration-200 ease-in-out active:scale-95 group">
            <span className="material-symbols-outlined icon-filled group-hover:scale-110 transition-transform">grid_view</span>
            <span>Dashboard</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors rounded-lg transition-all duration-200 ease-in-out active:scale-95 group">
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">event_available</span>
            <span>Bookings</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors rounded-lg transition-all duration-200 ease-in-out active:scale-95 group">
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">content_cut</span>
            <span>Services</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors rounded-lg transition-all duration-200 ease-in-out active:scale-95 group">
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">photo_library</span>
            <span>Portfolio</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors rounded-lg transition-all duration-200 ease-in-out active:scale-95 group">
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">chat</span>
            <span>Messages</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors rounded-lg transition-all duration-200 ease-in-out active:scale-95 group">
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">payments</span>
            <span>Earnings</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors rounded-lg transition-all duration-200 ease-in-out active:scale-95 group">
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">settings</span>
            <span>Settings</span>
          </Link>
        </nav>
        
        {/* CTA */}
        <div className="mt-auto pt-lg border-t border-outline-variant">
          <button className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-bold text-label-bold hover:opacity-90 transition-opacity active:scale-95">
            New Appointment
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full md:ml-64 relative">
        {/* TopAppBar */}
        <header className="flex justify-between items-center h-16 px-lg w-full bg-surface dark:bg-inverse-surface border-b border-outline-variant shadow-sm docked top-0 sticky z-40">
          <div className="flex items-center gap-sm">
            <span className="md:hidden font-headline-md text-headline-md font-black text-primary dark:text-inverse-primary cursor-pointer active:opacity-80">KinyoziHub</span>
            <span className="hidden md:inline font-headline-md text-headline-md font-black text-primary dark:text-inverse-primary cursor-pointer active:opacity-80">KinyoziHub</span>
          </div>
          
          <div className="flex items-center gap-md">
            <button className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors cursor-pointer active:opacity-80">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors cursor-pointer active:opacity-80 mr-sm">
              <span className="material-symbols-outlined">help</span>
            </button>
            <div className="h-8 w-8 rounded-full overflow-hidden border border-outline-variant cursor-pointer">
              <img 
                alt="Owner Avatar" 
                className="w-full h-full object-cover" 
                src={user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName)}&background=random`} 
              />
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-xl bg-surface-container-low">
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

              <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-variant shadow-[0px_6px_16px_rgba(0,0,0,0.03)] hover:shadow-[0px_6px_16px_rgba(0,0,0,0.08)] transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Profile Completion</p>
                  <span className="material-symbols-outlined text-on-surface bg-surface-variant p-1 rounded-full text-[18px]">storefront</span>
                </div>
                <p className="font-headline-lg text-headline-lg text-on-surface">85%</p>
                <div className="w-full bg-surface-variant rounded-full h-1.5 mt-2">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: '85%' }}></div>
                </div>
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
                      <button className="w-full py-2 border border-outline-variant text-on-surface rounded-lg font-label-bold text-label-bold hover:bg-surface-variant transition-colors">
                        View Profile
                      </button>
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
        </div>
      </main>
    </div>
  );
}
