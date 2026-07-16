"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

export default function ShopSettingsPage() {
  const { user } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cancellationPolicy: 'Flexible',
    bookingLeadTime: '2 hours',
    autoConfirmBookings: false,
    payoutMethod: ''
  });

  const loadShop = async () => {
    try {
      const response = await api.get('/shops/me/dashboard');
      if (response.data?.success && response.data?.data?.shop) {
        const loadedShop = response.data.data.shop;
        setShop(loadedShop);
        setFormData({
          name: loadedShop.name || '',
          description: loadedShop.description || '',
          cancellationPolicy: loadedShop.cancellationPolicy || 'Flexible',
          bookingLeadTime: loadedShop.bookingLeadTime || '2 hours',
          autoConfirmBookings: loadedShop.autoConfirmBookings || false,
          payoutMethod: loadedShop.payoutMethod || ''
        });
      }
    } catch (err) {
      console.error("Failed to load shop settings", err);
    }
  };

  useEffect(() => {
    loadShop();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await api.put('/shops/me/settings', formData);
      if (res.data) {
        await loadShop();
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings", err);
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen">
      {/* Top AppBar */}
      <header className="flex justify-between items-center h-16 px-6 bg-white border-b border-border shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black text-primary">Shop Settings</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <span className="material-symbols-outlined text-gray-500 cursor-pointer group-hover:text-primary transition-colors">notifications</span>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
          </div>
          <span className="material-symbols-outlined text-gray-500 cursor-pointer hover:text-primary transition-colors">help</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="py-8 px-6 min-h-screen">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Column Left: Profile & Business Rules */}
          <div className="md:col-span-7 flex flex-col gap-6">
            
            {/* SHOP PROFILE */}
            <section className="bg-white border border-border rounded-xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">store</span>
                  <h3 className="text-xl font-semibold">Shop Profile</h3>
                </div>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-textPrimary">Shop Name</label>
                  <input 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50" 
                    type="text" 
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-textPrimary">Description</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50" 
                    rows={4}
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-textPrimary">Logo upload</label>
                  <div className="flex items-center gap-6 p-4 border-2 border-dashed border-border rounded-xl bg-white">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      <span className="material-symbols-outlined text-gray-400 text-3xl">image</span>
                    </div>
                    <div className="flex flex-col">
                      <button className="text-primary font-semibold hover:underline text-left">Click to replace logo</button>
                      <p className="text-sm text-gray-500">SVG, PNG or JPG (max. 800x800px)</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* BUSINESS RULES */}
            <section className="bg-white border border-border rounded-xl shadow-sm p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary">gavel</span>
                <h3 className="text-xl font-semibold">Business Rules</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-textPrimary">Cancellation Policy</p>
                    <p className="text-sm text-gray-500">How long before an appointment can clients cancel for free?</p>
                  </div>
                  <select 
                    name="cancellationPolicy"
                    value={formData.cancellationPolicy}
                    onChange={handleChange}
                    className="px-4 py-2 rounded-lg border border-border bg-white font-semibold focus:outline-none"
                  >
                    <option value="Flexible">Flexible (24 Hours)</option>
                    <option value="Moderate">Moderate (48 Hours)</option>
                    <option value="Strict">Strict (No Refund)</option>
                  </select>
                </div>
                
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-textPrimary">Booking Lead Time</p>
                    <p className="text-sm text-gray-500">Minimum notice required for a new booking.</p>
                  </div>
                  <select 
                    name="bookingLeadTime"
                    value={formData.bookingLeadTime}
                    onChange={handleChange}
                    className="px-4 py-2 rounded-lg border border-border bg-white font-semibold focus:outline-none"
                  >
                    <option value="2 Hours">2 Hours</option>
                    <option value="1 Hour">1 Hour</option>
                    <option value="4 Hours">4 Hours</option>
                    <option value="Next Day">Next Day</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-4">
                  <input 
                    id="auto-confirm" 
                    name="autoConfirmBookings"
                    type="checkbox"
                    checked={formData.autoConfirmBookings}
                    onChange={handleChange}
                    className="w-5 h-5 text-primary rounded border-border focus:ring-primary" 
                  />
                  <label className="text-base font-semibold text-textPrimary cursor-pointer" htmlFor="auto-confirm">Auto-confirm all bookings</label>
                </div>
              </div>
            </section>
          </div>

          {/* Column Right: Billing & System */}
          <div className="md:col-span-5 flex flex-col gap-6">
            
            {/* BILLING & PLAN */}
            <section className="bg-white border border-border rounded-xl shadow-sm p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary">credit_card</span>
                <h3 className="text-xl font-semibold">Billing &amp; Payouts</h3>
              </div>
              
              <div className="p-4 bg-primary/10 rounded-xl mb-6">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-3 py-1 bg-white text-primary rounded-full text-xs font-bold uppercase tracking-wider">Current Plan</span>
                  <p className="text-lg font-bold text-primary">Free</p>
                </div>
                <h4 className="text-xl font-black text-primary">Basic Tier</h4>
                <p className="text-sm text-primary/80 mt-1">Standard listing with basic booking features.</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-600">account_balance_wallet</span>
                    </div>
                    <div>
                      <p className="font-semibold">Payout Method (M-Pesa)</p>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text"
                          name="payoutMethod"
                          value={formData.payoutMethod}
                          onChange={handleChange}
                          placeholder="+2547..."
                          className="text-sm border-b border-border focus:border-primary focus:outline-none bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    {shop?.payoutMethodVerified ? (
                      <span className="text-green-600 text-sm font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span> Verified
                      </span>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="text-amber-500 text-sm font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">warning</span> Unverified
                        </span>
                        <button 
                          disabled 
                          title="OTP verification flow coming soon"
                          className="text-xs text-primary underline mt-1 opacity-50 cursor-not-allowed"
                        >
                          Verify
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
            
            {/* SYSTEM */}
            <section className="bg-white border border-border rounded-xl shadow-sm p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary">tune</span>
                <h3 className="text-xl font-semibold">System Preferences</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                  <div className="flex flex-col">
                    <p className="font-semibold">Display Language</p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="font-semibold">English (UK)</span>
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* Contextual Toast Notification */}
      <div className={`fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-4 transform transition-transform duration-300 ${showToast ? 'translate-y-0' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
        <span className="material-symbols-outlined text-green-400">check_circle</span>
        <p className="font-semibold">Settings updated successfully</p>
      </div>
      <div className={`fixed bottom-6 right-6 bg-red-600 text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-4 transform transition-transform duration-300 ${showErrorToast ? 'translate-y-0' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
        <span className="material-symbols-outlined text-white">error</span>
        <p className="font-semibold">Failed to save changes, please try again.</p>
      </div>
    </div>
  );
}
