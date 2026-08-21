'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [shopName, setShopName] = useState('My Shop');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && user && user.role !== 'shop_owner') {
      router.push('/client/dashboard'); // Default fallback
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'shop_owner') {
      api.get('/shops/me/dashboard').then(res => {
        if (res.data?.success && res.data?.data?.shop?.name) {
          setShopName(res.data.data.shop.name);
        }
      }).catch(console.error);
    }
  }, [user]);

  if (isLoading || !user || user.role !== 'shop_owner') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

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
          <Link href="/shop/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-label-bold transition-all duration-200 ease-in-out active:scale-95 group ${pathname === '/shop/dashboard' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors'}`}>
            <span className="material-symbols-outlined icon-filled group-hover:scale-110 transition-transform">grid_view</span>
            <span>Dashboard</span>
          </Link>
          <Link href="/shop/bookings" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-label-bold transition-all duration-200 ease-in-out active:scale-95 group ${pathname === '/shop/bookings' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors'}`}>
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">event_available</span>
            <span>Bookings</span>
          </Link>
          <Link href="/shop/services" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-label-bold transition-all duration-200 ease-in-out active:scale-95 group ${pathname === '/shop/services' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors'}`}>
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">content_cut</span>
            <span>Services</span>
          </Link>
          <Link href="/shop/portfolio" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-label-bold transition-all duration-200 ease-in-out active:scale-95 group ${pathname === '/shop/portfolio' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors'}`}>
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">photo_library</span>
            <span>Portfolio</span>
          </Link>
          <Link href="/shop/messages" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-label-bold transition-all duration-200 ease-in-out active:scale-95 group ${pathname.startsWith('/shop/messages') ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors'}`}>
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">chat</span>
            <span>Messages</span>
          </Link>
          <Link href="/shop/earnings" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-label-bold transition-all duration-200 ease-in-out active:scale-95 group ${pathname === '/shop/earnings' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors'}`}>
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">payments</span>
            <span>Earnings</span>
          </Link>
          <Link href="/shop/settings" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-label-bold transition-all duration-200 ease-in-out active:scale-95 group ${pathname === '/shop/settings' ? 'bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary' : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors'}`}>
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
            <Link href="/shop/notifications" className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors cursor-pointer active:opacity-80 block">
              <span className="material-symbols-outlined">notifications</span>
            </Link>
            <button className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors cursor-pointer active:opacity-80 mr-sm">
              <span className="material-symbols-outlined">help</span>
            </button>
            <Link href="/shop/settings" className="h-8 w-8 rounded-full overflow-hidden border border-outline-variant cursor-pointer block hover:opacity-80 transition-opacity">
              <img 
                alt="Owner Avatar" 
                className="w-full h-full object-cover" 
                src={(user as any)?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName)}&background=random`} 
              />
            </Link>
          </div>
        </header>

        {/* Scrollable Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-xl bg-surface-container-low">
            {children}
        </div>
      </main>
    </div>
  );
}
