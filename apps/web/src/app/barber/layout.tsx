'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';

export default function BarberLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && user && user.role !== 'barber') {
      router.push('/client/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'barber') {
      api.get('/barbers/me').then(res => {
        if (res.data?.success) {
          setProfile(res.data.data);
        }
      }).catch(console.error);
    }
  }, [user]);

  if (isLoading || !user || user.role !== 'barber') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="text-textPrimary bg-gray-50 min-h-screen flex">
      {/* SideNavBar */}
      <aside className="hidden lg:flex flex-col h-screen p-4 bg-white border-r border-border w-64 fixed left-0 top-0 shadow-sm z-50">
        <div className="mb-8 px-4">
          <h1 className="text-xl font-bold text-primary">ProBarber Studio</h1>
          <p className="text-sm text-gray-500 capitalize">{profile?.tier || 'Free'} Tier</p>
        </div>
        <nav className="flex-1 space-y-1">
          <Link href="/barber/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out active:scale-95 ${pathname === '/barber/dashboard' ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/barber/dashboard' ? "'FILL' 1" : "'FILL' 0" }}>grid_view</span>
            <span>Dashboard</span>
          </Link>
          <Link href="/barber/bookings" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out active:scale-95 ${pathname === '/barber/bookings' ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/barber/bookings' ? "'FILL' 1" : "'FILL' 0" }}>event_available</span>
            <span>Bookings</span>
          </Link>
          <Link href="/barber/services" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out active:scale-95 ${pathname === '/barber/services' ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/barber/services' ? "'FILL' 1" : "'FILL' 0" }}>content_cut</span>
            <span>Services</span>
          </Link>
          <Link href="/barber/portfolio" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out active:scale-95 ${pathname === '/barber/portfolio' ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/barber/portfolio' ? "'FILL' 1" : "'FILL' 0" }}>photo_library</span>
            <span>Portfolio</span>
          </Link>
          <Link href="/barber/messages" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out active:scale-95 ${pathname === '/barber/messages' || pathname?.startsWith('/barber/messages/') ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/barber/messages' || pathname?.startsWith('/barber/messages/') ? "'FILL' 1" : "'FILL' 0" }}>chat</span>
            <span>Messages</span>
          </Link>
          <Link href="/barber/earnings" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out active:scale-95 ${pathname === '/barber/earnings' ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/barber/earnings' ? "'FILL' 1" : "'FILL' 0" }}>payments</span>
            <span>Earnings</span>
          </Link>
          <Link href="/barber/settings" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out active:scale-95 ${pathname === '/barber/settings' ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/barber/settings' ? "'FILL' 1" : "'FILL' 0" }}>settings</span>
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

      <div className="flex-1 flex flex-col min-h-screen">
        {/* TopAppBar */}
        <header className="flex justify-between items-center h-16 px-6 lg:ml-64 w-full lg:w-[calc(100%-16rem)] bg-white border-b border-border shadow-sm sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <span className="text-xl font-black text-primary">KinyoziHub</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/barber/notifications" className="relative group cursor-pointer">
              <span className="material-symbols-outlined text-gray-500 hover:text-primary transition-colors">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
            </Link>
            <span className="material-symbols-outlined text-gray-500 hover:text-primary transition-colors cursor-pointer">help</span>
            <div className="h-8 w-[1px] bg-border mx-2 hidden sm:block"></div>
            <Link href="/barber/settings" className="flex items-center gap-3 cursor-pointer group hover:opacity-80 transition-opacity">
              <div className="text-right hidden sm:block">
                <p className="font-semibold text-textPrimary leading-tight">{user.name}</p>
                <p className="text-[11px] text-gray-500 capitalize">{profile?.tier === 'premium' ? 'Pro Barber' : 'Master Barber'}</p>
              </div>
              {profile?.profileImage ? (
                <img className="w-10 h-10 rounded-full border-2 border-primary object-cover" alt="Profile" src={profile.profileImage} />
              ) : (
                <div className="w-10 h-10 rounded-full border-2 border-primary bg-gray-200 flex items-center justify-center font-bold">{user.name.substring(0, 2).toUpperCase()}</div>
              )}
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="lg:ml-64 p-4 lg:p-6 flex-1">
          {children}
        </main>
      </div>

      {/* Global Contextual FAB */}
      <button className="fixed bottom-6 right-6 bg-primary text-white shadow-lg w-14 h-14 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 group">
        <span className="material-symbols-outlined text-[28px]">add</span>
        <span className="absolute right-16 bg-textPrimary text-white px-3 py-1.5 rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm pointer-events-none">New Appointment</span>
      </button>
    </div>
  );
}
