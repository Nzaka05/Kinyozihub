'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 pb-[72px] md:pb-0">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="md:hidden bg-white flex justify-around items-center h-[72px] pb-safe fixed bottom-0 w-full z-50 rounded-t-xl shadow-[0px_-1px_0px_rgba(0,0,0,0.05)] border-t border-border">
        <Link href="/client/dashboard" className={`flex flex-col items-center justify-center w-full h-full transition-colors active:scale-90 transition-transform duration-150 ${pathname === '/client/dashboard' ? 'text-primary' : 'text-gray-500 hover:bg-gray-50'}`}>
          <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: pathname === '/client/dashboard' ? "'FILL' 1" : "'FILL' 0" }}>explore</span>
          <span className="font-semibold text-[10px] leading-none">Discover</span>
        </Link>
        <Link href="/client/bookings" className={`flex flex-col items-center justify-center w-full h-full transition-colors active:scale-90 transition-transform duration-150 ${pathname === '/client/bookings' ? 'text-primary' : 'text-gray-500 hover:bg-gray-50'}`}>
          <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: pathname === '/client/bookings' ? "'FILL' 1" : "'FILL' 0" }}>calendar_month</span>
          <span className="font-semibold text-[10px] leading-none">Bookings</span>
        </Link>
        <div className="flex flex-col items-center justify-center w-full h-full text-gray-300 cursor-not-allowed">
          <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: "'FILL' 0" }}>chat_bubble</span>
          <span className="font-semibold text-[10px] leading-none">Messages</span>
        </div>
        <Link href="/client/settings" className={`flex flex-col items-center justify-center w-full h-full transition-colors active:scale-90 transition-transform duration-150 ${pathname === '/client/settings' ? 'text-primary' : 'text-gray-500 hover:bg-gray-50'}`}>
          <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: pathname === '/client/settings' ? "'FILL' 1" : "'FILL' 0" }}>person</span>
          <span className="font-semibold text-[10px] leading-none">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
