"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import ClientDrawer from '@/components/ClientDrawer';
import { api } from "@/lib/api";

export default function ClientSettingsPage() {
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [preferences, setPreferences] = useState({
    bookingUpdates: true,
    newMessages: true,
    promotionalOffers: false,
    language: 'English',
    theme: 'light'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const loadPreferences = async () => {
    try {
      const response = await api.get('/auth/settings');
      if (response.data?.success && response.data?.data) {
        setPreferences(prev => ({
          ...prev,
          ...response.data.data
        }));
      }
    } catch (err) {
      console.error("Failed to load preferences", err);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const updatePreference = async (key: string, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    
    try {
      setIsSaving(true);
      await api.put('/auth/settings', { preferences: newPreferences });
      await loadPreferences();
    } catch (err) {
      console.error('Failed to save preference', err);
      // Revert on error
      setPreferences(preferences);
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen pb-24">
      {/* TopAppBar */}
      <header className="sticky top-0 z-40 bg-surface h-16 flex items-center justify-between px-5 w-full border-b border-border shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsDrawerOpen(true)} className="flex items-center justify-center w-10 h-10 hover:bg-gray-100 transition-colors rounded-full text-gray-500 active:scale-95 transition-transform">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="text-xl font-semibold text-primary">Settings</h1>
        </div>
        <div className="flex items-center">
          <button className="flex items-center justify-center w-10 h-10 hover:bg-gray-100 transition-colors rounded-full text-gray-500 opacity-50 cursor-not-allowed">
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-6 max-w-2xl mx-auto">
        {/* Section 1: Notifications */}
        <section className="mt-4 px-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-1 px-2 uppercase tracking-wider">Notifications</h2>
          <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
            
            {/* Row 1 */}
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary">notifications</span>
                <div>
                  <p className="text-sm font-semibold">Booking Updates</p>
                  <p className="text-sm text-gray-500">Confirmed appointments and reminders</p>
                </div>
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
            <div className="h-px bg-border mx-4"></div>
            
            {/* Row 2 */}
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary">chat</span>
                <div>
                  <p className="text-sm font-semibold">New Messages</p>
                  <p className="text-sm text-gray-500">Alerts from your barber</p>
                </div>
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
            <div className="h-px bg-border mx-4"></div>
            
            {/* Row 3 */}
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary">campaign</span>
                <div>
                  <p className="text-sm font-semibold">Promotional Offers</p>
                  <p className="text-sm text-gray-500">Discounts and seasonal specials</p>
                </div>
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
          </div>
        </section>

        {/* Section 2: Account Security */}
        <section className="mt-8 px-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-1 px-2 uppercase tracking-wider">Account Security</h2>
          <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200 opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-gray-500">phone_iphone</span>
                <p className="text-sm font-semibold text-textPrimary">Change Phone Number</p>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>
            <div className="h-px bg-border mx-4"></div>
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200 opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-gray-500">lock</span>
                <p className="text-sm font-semibold text-textPrimary">Privacy Settings</p>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>
            <div className="h-px bg-border mx-4"></div>
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200 opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-gray-500">database</span>
                <p className="text-sm font-semibold text-textPrimary">Data Management</p>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>
          </div>
        </section>

        {/* Section 3: Preferences */}
        <section className="mt-8 px-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-1 px-2 uppercase tracking-wider">Preferences</h2>
          <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200 opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-gray-500">language</span>
                <p className="text-sm font-semibold text-textPrimary">Language selection</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">{preferences.language}</span>
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
              </div>
            </button>
            <div className="h-px bg-border mx-4"></div>
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200 opacity-50 cursor-not-allowed" title="Dark mode is not currently supported">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-gray-500">contrast</span>
                <p className="text-sm font-semibold text-textPrimary">App Theme</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">{preferences.theme === 'light' ? 'Light' : 'System'}</span>
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
              </div>
            </button>
          </div>
        </section>

        {/* Section 4: Support */}
        <section className="mt-8 px-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-1 px-2 uppercase tracking-wider">Support</h2>
          <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
            <a href="#" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-gray-500">help</span>
                <p className="text-sm font-semibold text-textPrimary">Help Center</p>
              </div>
              <span className="material-symbols-outlined text-gray-400">open_in_new</span>
            </a>
            <div className="h-px bg-border mx-4"></div>
            <a href="#" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-red-500">report</span>
                <p className="text-sm font-semibold text-red-500">Report an Issue</p>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </a>
          </div>
        </section>

        {/* Log Out */}
        <div className="mt-10 px-5 pb-12">
          <p className="text-center mt-4 text-xs text-gray-400">KinyoziHub v2.4.0</p>
        </div>
      </main>

      <ClientDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      
      <div className={`fixed bottom-6 right-6 bg-red-600 text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-4 transform transition-transform duration-300 ${showErrorToast ? 'translate-y-0' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
        <span className="material-symbols-outlined text-white">error</span>
        <p className="font-semibold">Failed to save changes, please try again.</p>
      </div>
    </div>
  );
}
