'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ClientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClientDrawer({ isOpen, onClose }: ClientDrawerProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // If the drawer is fully closed, we can return null to avoid rendering it.
  // However, returning early prevents transition animations if we want them.
  // We'll keep it simple for now as the transition classes handle the visual open/close.

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  const navItems = [
    { label: 'Home/Discover', path: '/client/dashboard', icon: 'explore', activeIconStyle: "'FILL' 1", enabled: true },
    { label: 'My Bookings', path: '/client/bookings', icon: 'calendar_month', activeIconStyle: "'FILL' 0", enabled: true },
    { label: 'Messages', path: '/client/messages', icon: 'chat', activeIconStyle: "'FILL' 1", enabled: true },
    { label: 'Notifications', path: '/client/notifications', icon: 'notifications', enabled: true },
    { label: 'My Referrals', path: '#', icon: 'group_add', enabled: false },
    { label: 'Favorite Barbers', path: '#', icon: 'content_cut', enabled: false },
    { label: 'Payment Methods', path: '#', icon: 'payments', enabled: false },
    { divider: true },
    { label: 'Settings', path: '/client/settings', icon: 'settings', enabled: true },
    { label: 'Help & Support', path: '#', icon: 'help', enabled: false },
    { label: 'Terms of Service', path: '#', icon: 'description', enabled: false },
  ];

  return (
    <>
      {/* Navigation Overlay Scrim */}
      <div 
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* NavigationDrawer */}
      <aside 
        className={`fixed top-0 left-0 h-[100dvh] w-80 bg-white rounded-r-xl shadow-2xl z-50 flex flex-col py-6 overflow-y-auto transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header: Profile Section */}
        <Link href="/client/profile" onClick={onClose} className="px-6 mb-8 flex flex-col items-start block hover:opacity-80 transition-opacity">
          <div className="w-16 h-16 rounded-full overflow-hidden mb-4 border-2 border-primary/20 bg-gray-200">
            <img 
              className="w-full h-full object-cover" 
              alt={user?.name || "User Profile"} 
              src={(user as any)?.profileImage || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`}
            />
          </div>
          <h2 className="text-xl font-semibold text-textPrimary">
            {user?.name || 'Client User'}
          </h2>
          <p className="text-base font-normal text-gray-500">
            {(user as any)?.email || 'Client Account'}
          </p>
        </Link>

        {/* Navigation List */}
        <nav className="flex-1 flex flex-col">
          {navItems.map((item, index) => {
            if (item.divider) {
              return <div key={`divider-${index}`} className="my-4 border-t border-outline-variant mx-4"></div>;
            }

            const isActive = pathname === item.path;

            if (!item.enabled) {
              return (
                <div 
                  key={index} 
                  className="text-gray-500/50 mx-2 px-4 py-3 flex items-center gap-3 cursor-not-allowed"
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
              );
            }

            return (
              <Link
                key={index}
                href={item.path}
                onClick={onClose}
                className={`mx-2 px-4 py-3 flex items-center gap-3 transition-all rounded-full active:opacity-80 ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span 
                  className="material-symbols-outlined"
                  style={isActive && item.activeIconStyle ? { fontVariationSettings: item.activeIconStyle } : {}}
                >
                  {item.icon}
                </span>
                <span className="text-sm font-semibold">{item.label}</span>
              </Link>
            );
          })}

          <div className="mt-auto pt-8 pb-4">
            {/* Logout */}
            <button 
              onClick={handleLogout}
              className="w-[calc(100%-16px)] text-red-500 mx-2 px-4 py-3 flex items-center gap-3 hover:bg-red-50 transition-all rounded-full active:opacity-80"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="text-sm font-semibold">Logout</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
