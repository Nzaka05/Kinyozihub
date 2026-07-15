'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Booking {
  _id: string;
  serviceName: string;
  price: number;
  date: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  client: {
    name: string;
    profileImage?: string;
  };
}

interface BarberProfile {
  tier: 'free' | 'premium';
  commissionRate: number;
  shopName: string;
  profileImage: string;
  rating: number;
  reviewCount: number;
  portfolioImages: string[];
}

export default function BarberDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<BarberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [bookingsRes, profileRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/barbers/me')
      ]);
      
      if (bookingsRes.data?.success) {
        setBookings(bookingsRes.data.data);
      }
      
      if (profileRes.data?.success) {
        setProfile(profileRes.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading]);

  const handleStatusUpdate = async (id: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      const response = await api.patch(`/bookings/${id}/status`, { status });
      if (response.data?.success) {
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysBookings = bookings.filter(b => {
    const d = new Date(b.date);
    return d >= today && d < tomorrow;
  });

  const activeBookings = todaysBookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  
  const thisWeekBookings = bookings.filter(b => b.status === 'completed' && new Date(b.date) >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));
  const estimatedEarnings = thisWeekBookings.reduce((sum, b) => sum + b.price, 0);

  const monthlyBookings = bookings.filter(b => new Date(b.date) >= new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000));

  const profileCompletion = profile?.portfolioImages?.length ? 100 : 80;

  return (
    <div className="text-textPrimary bg-gray-50 min-h-screen">
      {/* SideNavBar Anchor */}
      <aside className="hidden lg:flex flex-col h-screen p-4 bg-white border-r border-border w-64 fixed left-0 top-0 shadow-sm z-50">
        <div className="mb-8 px-4">
          <h1 className="text-xl font-bold text-primary">ProBarber Studio</h1>
          <p className="text-sm text-gray-500 capitalize">{profile?.tier || 'Free'} Tier</p>
        </div>
        <nav className="flex-1 space-y-1">
          <Link href="/barber/dashboard" className="flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary rounded-lg font-semibold transition-all duration-200 ease-in-out active:scale-95">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
            <span>Dashboard</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors duration-200 ease-in-out active:scale-95">
            <span className="material-symbols-outlined">event_available</span>
            <span>Bookings</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors duration-200 ease-in-out active:scale-95">
            <span className="material-symbols-outlined">content_cut</span>
            <span>Services</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors duration-200 ease-in-out active:scale-95">
            <span className="material-symbols-outlined">photo_library</span>
            <span>Portfolio</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors duration-200 ease-in-out active:scale-95">
            <span className="material-symbols-outlined">chat</span>
            <span>Messages</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors duration-200 ease-in-out active:scale-95">
            <span className="material-symbols-outlined">payments</span>
            <span>Earnings</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors duration-200 ease-in-out active:scale-95">
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </Link>
        </nav>
        {profile?.tier === 'free' && (
          <div className="mt-auto p-4 bg-gray-50 rounded-xl border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 bg-textPrimary text-white text-[10px] font-bold rounded uppercase">Free Tier</span>
            </div>
            <p className="text-[12px] text-gray-500 mb-3">Unlock pro tools and lower commission rates.</p>
            <Link href="#" className="text-[12px] font-bold text-primary hover:underline">Upgrade to Pro</Link>
          </div>
        )}
      </aside>

      {/* TopAppBar Anchor */}
      <header className="flex justify-between items-center h-16 px-6 lg:ml-64 w-full lg:w-[calc(100%-16rem)] bg-white border-b border-border shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <span className="text-xl font-black text-primary">KinyoziHub</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative group cursor-pointer">
            <span className="material-symbols-outlined text-gray-500 hover:text-primary transition-colors">notifications</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
          </div>
          <span className="material-symbols-outlined text-gray-500 hover:text-primary transition-colors cursor-pointer">help</span>
          <div className="h-8 w-[1px] bg-border mx-2 hidden sm:block"></div>
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="text-right hidden sm:block">
              <p className="font-semibold text-textPrimary leading-tight">{user.name}</p>
              <p className="text-[11px] text-gray-500 capitalize">{profile?.tier === 'premium' ? 'Pro Barber' : 'Master Barber'}</p>
            </div>
            {profile?.profileImage ? (
              <img className="w-10 h-10 rounded-full border-2 border-primary object-cover" alt="Profile" src={profile.profileImage} />
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-primary bg-gray-200 flex items-center justify-center font-bold">{user.name.substring(0, 2).toUpperCase()}</div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="lg:ml-64 p-4 lg:p-6">
        {/* Section 1: Overview Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-8 lg:grid-cols-5">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Today's Bookings</span>
              <span className="material-symbols-outlined text-secondary">calendar_today</span>
            </div>
            <p className="text-3xl font-semibold text-textPrimary">{activeBookings.length}</p>
            <p className="text-[12px] text-gray-500 font-medium mt-2">Pending & Confirmed</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Weekly Earnings</span>
              <span className="material-symbols-outlined text-secondary">payments</span>
            </div>
            <p className="text-3xl font-semibold text-primary">KES {estimatedEarnings.toLocaleString()}</p>
            <p className="text-[12px] text-gray-500 font-medium mt-2">Payout in 2 days</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Monthly Bookings</span>
              <span className="material-symbols-outlined text-secondary">analytics</span>
            </div>
            <p className="text-3xl font-semibold text-textPrimary">{monthlyBookings.length}</p>
            <p className="text-[12px] text-gray-500 mt-2">Last 30 days</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Profile Completion</span>
              <span className="material-symbols-outlined text-primary">bolt</span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-xl font-semibold text-textPrimary">{profileCompletion}%</span>
              <span className="text-[11px] text-gray-500">complete</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mb-3 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: `${profileCompletion}%` }}></div>
            </div>
            <p className="text-[11px] text-gray-500 leading-tight">
              {profileCompletion === 100 ? 'Your profile is fully optimized!' : 'Add more portfolio photos to reach 100%'}
            </p>
          </div>
          <div className="bg-primary/10 p-6 rounded-2xl shadow-sm border border-primary/20 flex flex-col justify-between group cursor-pointer hover:bg-primary/20 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-primary font-bold">Quick Action</span>
              <span className="material-symbols-outlined text-primary">rocket_launch</span>
            </div>
            <h3 className="font-semibold text-textPrimary mb-2">Boost Visibility</h3>
            <button className="w-full bg-primary text-white text-[12px] font-bold py-2 rounded-lg hover:scale-105 transition-all active:scale-95">
              Boost Profile
            </button>
          </div>
        </section>

        {/* Bento-ish Layout for Main Sections */}
        <div className="grid grid-cols-12 gap-6 items-start">
          
          {/* Section 2: Today's Bookings (Left Column) */}
          <section className="col-span-12 lg:col-span-7 bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-semibold text-textPrimary">Today's Appointments</h2>
              <button className="text-sm font-semibold text-primary hover:bg-primary/5 px-4 py-2 rounded-lg transition-colors">View All</button>
            </div>
            <div className="divide-y divide-border">
              {todaysBookings.length === 0 ? (
                 <div className="p-6 text-center text-gray-500">No appointments scheduled for today.</div>
              ) : (
                todaysBookings.map((booking) => {
                  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
                  
                  return (
                    <div key={booking._id} className={`p-6 flex items-center justify-between hover:bg-gray-50 transition-colors ${booking.status === 'completed' || booking.status === 'cancelled' ? 'opacity-60' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 border border-border overflow-hidden flex items-center justify-center font-bold text-textPrimary flex-shrink-0">
                          {booking.client?.profileImage ? (
                            <img src={booking.client.profileImage} alt={booking.client.name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(booking.client?.name)
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-textPrimary">{booking.client?.name}</p>
                          <p className="text-sm text-gray-500">{booking.serviceName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-8">
                        <div className="text-right">
                          <p className="font-semibold text-textPrimary">{booking.timeSlot}</p>
                          {booking.status === 'pending' && <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFF4E5] text-[#F5A623] uppercase">Pending</span>}
                          {booking.status === 'confirmed' && <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#E6F6F0] text-[#1DA463] uppercase">Confirmed</span>}
                          {booking.status === 'completed' && <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-600 uppercase">Completed</span>}
                          {booking.status === 'cancelled' && <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 uppercase">Cancelled</span>}
                        </div>
                        <div className="flex gap-2 min-w-[104px] justify-end">
                          {booking.status === 'pending' && (
                            <>
                              <button onClick={() => handleStatusUpdate(booking._id, 'confirmed')} className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-green-600 hover:bg-green-50 transition-all active:scale-90" title="Confirm">
                                <span className="material-symbols-outlined text-[18px]">check</span>
                              </button>
                              <button onClick={() => handleStatusUpdate(booking._id, 'cancelled')} className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-destructive hover:bg-red-50 transition-all active:scale-90" title="Decline">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                              </button>
                            </>
                          )}
                          {booking.status === 'confirmed' && (
                            <button onClick={() => handleStatusUpdate(booking._id, 'completed')} className="text-sm font-semibold text-secondary px-3 py-1 border border-secondary rounded-lg hover:bg-secondary/5 transition-colors">
                              Check-in
                            </button>
                          )}
                          {booking.status === 'completed' && (
                            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Right Column: Calendar & Portfolio */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
            
            {/* Section 3: Upcoming Calendar */}
            <section className="bg-white rounded-2xl shadow-sm border border-border p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-textPrimary">This Week</h2>
                  <p className="text-sm text-gray-500">
                    {today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                    {new Date(today.getTime() + 6*24*60*60*1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <button className="bg-secondary text-white text-[12px] font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-secondary/90 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">block</span> Block Time
                </button>
              </div>

              {/* Mini Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <span key={i} className="text-[11px] font-bold text-gray-500 uppercase">{day}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2 mb-6">
                {[...Array(7)].map((_, i) => {
                  const d = new Date(today.getTime() + (i - 2) * 24 * 60 * 60 * 1000); // just to simulate days around today
                  const isToday = i === 2;
                  return (
                    <div key={i} className={`aspect-square flex items-center justify-center text-sm font-medium rounded-lg cursor-pointer ${isToday ? 'bg-primary text-white shadow-sm' : 'hover:bg-gray-50 text-textPrimary'}`}>
                      {d.getDate()}
                    </div>
                  );
                })}
              </div>

              {/* Daily Timeline */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-500 w-14">11:00 AM</span>
                  <div className="flex-1 h-8 rounded-lg bg-gray-50 border border-border"></div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-500 w-14">12:00 PM</span>
                  <div className="flex-1 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center px-3">
                    <span className="text-[10px] font-bold text-secondary">Sarah A. - Confirmed</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-500 w-14">01:00 PM</span>
                  <div className="flex-1 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center px-3">
                    <span className="text-[10px] font-bold text-primary">Break - Personal</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-500 w-14">02:00 PM</span>
                  <div className="flex-1 h-8 rounded-lg bg-gray-50 border border-border"></div>
                </div>
              </div>
            </section>

            {/* Section 4 (Part A): Portfolio Quick View */}
            <section className="bg-white rounded-2xl shadow-sm border border-border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-textPrimary">Portfolio</h2>
                <button className="material-symbols-outlined text-gray-500 hover:text-primary transition-colors">add_a_photo</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {profile?.portfolioImages?.slice(0, 3).map((img, i) => (
                  <div key={i} className="aspect-square rounded-lg bg-gray-100 overflow-hidden border border-border">
                    <img src={img} className="w-full h-full object-cover" alt="Portfolio" />
                  </div>
                ))}
                {(!profile?.portfolioImages || profile.portfolioImages.length < 3) && (
                  <div className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined">add</span>
                    <span className="text-[10px] font-bold mt-1">Add</span>
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* Section 4 (Part B): Profile Tabs Section (Full Width) */}
          <section className="col-span-12 bg-white rounded-2xl shadow-sm border border-border mb-8">
            <div className="px-6 pt-6 border-b border-border">
              <div className="flex gap-8 overflow-x-auto">
                <button className="pb-4 font-semibold text-primary border-b-2 border-primary transition-all whitespace-nowrap">Services</button>
                <button className="pb-4 font-semibold text-gray-500 hover:text-textPrimary transition-all whitespace-nowrap">Working Hours</button>
                <button className="pb-4 font-semibold text-gray-500 hover:text-textPrimary transition-all whitespace-nowrap">Business Info</button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Service Item */}
                <div className="p-4 border border-border rounded-xl flex items-center justify-between group hover:border-secondary transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined">content_cut</span>
                    </div>
                    <div>
                      <p className="font-semibold text-textPrimary">Signature Fade</p>
                      <p className="text-sm text-gray-500">KES 1,200 • 45 mins</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-secondary"></div>
                    </div>
                    <button className="material-symbols-outlined text-gray-400 hover:text-textPrimary text-[20px]">edit</button>
                  </div>
                </div>

                {/* Service Item */}
                <div className="p-4 border border-border rounded-xl flex items-center justify-between group hover:border-secondary transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined">face</span>
                    </div>
                    <div>
                      <p className="font-semibold text-textPrimary">Hot Towel Shave</p>
                      <p className="text-sm text-gray-500">KES 800 • 30 mins</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-secondary"></div>
                    </div>
                    <button className="material-symbols-outlined text-gray-400 hover:text-textPrimary text-[20px]">edit</button>
                  </div>
                </div>

                {/* Add Service Button */}
                <div className="p-4 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-50 transition-all cursor-pointer">
                  <span className="material-symbols-outlined">add</span>
                  <span className="font-semibold">Add New Service</span>
                </div>

              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Global Contextual FAB */}
      <button className="fixed bottom-6 right-6 bg-primary text-white shadow-lg w-14 h-14 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 group">
        <span className="material-symbols-outlined text-[28px]">add</span>
        <span className="absolute right-16 bg-textPrimary text-white px-3 py-1.5 rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm pointer-events-none">New Appointment</span>
      </button>

    </div>
  );
}
