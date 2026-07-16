"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from 'next/navigation';
import { api } from "@/lib/api";

export default function ClientProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [preferences, setPreferences] = useState({
    bookingUpdates: true,
    newMessages: true,
    promotionalOffers: false,
    language: 'English',
  });

  useEffect(() => {
    if ((user as any)?.preferences) {
      setPreferences({
        ...preferences,
        ...(user as any).preferences
      });
    }
  }, [user]);

  const updatePreference = async (key: string, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    
    try {
      await api.put('/user/settings', { preferences: newPreferences });
    } catch (err) {
      console.error('Failed to save preference', err);
      setPreferences(preferences);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="bg-background text-on-surface min-h-screen pb-32">
      {/* Top App Bar */}
      <header className="bg-surface sticky top-0 z-40 flex items-center justify-between px-5 w-full h-16 border-b border-border shadow-sm">
        <button onClick={() => router.push('/client/settings')} className="p-2 transition-colors duration-200 hover:bg-gray-100 rounded-full flex items-center justify-center text-primary">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <h1 className="text-xl font-semibold text-primary">Profile</h1>
        <div className="w-10"></div> {/* Spacer for symmetry */}
      </header>
      
      <main className="max-w-4xl mx-auto px-5 pt-8">
        {/* Header / Profile Section */}
        <section className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-gray-100 shadow-sm overflow-hidden bg-gray-200">
              <img 
                className="w-full h-full object-cover" 
                alt={user?.name || "User"} 
                src={(user as any)?.profileImage || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`}
              />
            </div>
            <button className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-md flex items-center justify-center active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
          </div>
          <h2 className="text-2xl font-bold text-textPrimary">{user?.name || 'Client User'}</h2>
          <p className="text-sm text-gray-500 mt-1">{user?.phone || '+254 XXX XXX XXX'}</p>
        </section>

        {/* Settings List */}
        <div className="space-y-8">
          {/* Account Section */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Account</h3>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-border">
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200 border-b border-border opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-gray-500">person_outline</span>
                  <span className="text-base text-textPrimary">Edit Profile</span>
                </div>
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
              </button>
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200 border-b border-border opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-gray-500">lock_outline</span>
                  <span className="text-base text-textPrimary">Change Password</span>
                </div>
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
              </button>
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200 opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-gray-500">phone_iphone</span>
                  <span className="text-base text-textPrimary">Phone Number</span>
                </div>
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
              </button>
            </div>
          </section>

          {/* Preferences Section */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Preferences</h3>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-border">
              <div className="flex items-center justify-between p-4 border-b border-border hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-gray-500">notifications_active</span>
                  <span className="text-base text-textPrimary">Booking Updates</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={preferences.bookingUpdates}
                    onChange={(e) => updatePreference('bookingUpdates', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 border-b border-border hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-gray-500">chat_bubble_outline</span>
                  <span className="text-base text-textPrimary">Messages</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={preferences.newMessages}
                    onChange={(e) => updatePreference('newMessages', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 border-b border-border hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-gray-500">campaign</span>
                  <span className="text-base text-textPrimary">Promotions</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={preferences.promotionalOffers}
                    onChange={(e) => updatePreference('promotionalOffers', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200 opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-gray-500">language</span>
                  <span className="text-base text-textPrimary">Language</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">{preferences.language}</span>
                  <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                </div>
              </button>
            </div>
          </section>

          {/* Support Section */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Support</h3>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-border">
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200 border-b border-border">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-gray-500">help_outline</span>
                  <span className="text-base text-textPrimary">Help Center</span>
                </div>
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
              </button>
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200 border-b border-border">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-gray-500">contact_support</span>
                  <span className="text-base text-textPrimary">Contact Support</span>
                </div>
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
              </button>
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200 border-b border-border">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-gray-500">description</span>
                  <span className="text-base text-textPrimary">Terms of Service</span>
                </div>
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
              </button>
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-gray-500">policy</span>
                  <span className="text-base text-textPrimary">Privacy Policy</span>
                </div>
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
              </button>
            </div>
          </section>

          {/* Account Actions */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Account Actions</h3>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-border">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-4 p-4 hover:bg-red-50 transition-colors duration-200 text-red-500"
              >
                <span className="material-symbols-outlined">logout</span>
                <span className="text-base font-semibold">Log Out</span>
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 pb-10 flex flex-col items-center">
          <p className="text-gray-400 text-sm">KinyoziHub v2.4.0</p>
        </footer>
      </main>
    </div>
  );
}
