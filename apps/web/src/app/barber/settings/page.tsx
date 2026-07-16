"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function BarberSettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    specialties: '',
    payoutMethod: '',
    workingHours: DAYS_OF_WEEK.map((_, i) => ({ dayOfWeek: i, isOpen: true, openTime: '09:00', closeTime: '18:00' }))
  });

  const loadProfile = async () => {
    try {
      const response = await api.get('/barbers/me');
      if (response.data?.success && response.data?.data) {
        const profileData = response.data.data;
        setProfile(profileData);
        
        let wh = profileData.workingHours;
        if (!wh || wh.length === 0) {
          wh = DAYS_OF_WEEK.map((_, i) => ({ dayOfWeek: i, isOpen: true, openTime: '09:00', closeTime: '18:00' }));
        }

        setFormData({
          name: user?.name || '',
          bio: profileData.bio || '',
          specialties: (profileData.specialties || []).join(', '),
          payoutMethod: profileData.payoutMethod || '',
          workingHours: wh
        });
      }
    } catch (err) {
      console.error("Failed to load barber profile", err);
    }
  };

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWorkingHourChange = (index: number, field: string, value: any) => {
    const newWorkingHours = [...formData.workingHours];
    newWorkingHours[index] = { ...newWorkingHours[index], [field]: value };
    setFormData(prev => ({ ...prev, workingHours: newWorkingHours }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const promises = [
        api.put('/barbers/me/settings', {
          ...formData,
          specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean)
        })
      ];

      // Sync the user's display name if it changed
      if (formData.name !== user?.name) {
        promises.push(api.put('/auth/me', { name: formData.name }));
      }

      const [res] = await Promise.all(promises);
      if (res.data) {
        await loadProfile();
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
    <div className="bg-surface min-h-screen pb-20">
      {/* Top AppBar */}
      <header className="flex justify-between items-center h-16 px-6 bg-white border-b border-border shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black text-primary">Barber Settings</h2>
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
          {/* Column Left: Profile & Hours */}
          <div className="md:col-span-7 flex flex-col gap-6">
            
            {/* BARBER PROFILE */}
            <section className="bg-white border border-border rounded-xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">person</span>
                  <h3 className="text-xl font-semibold">Personal Profile</h3>
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
                  <label className="text-sm font-semibold text-textPrimary">Display Name</label>
                  <input 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50" 
                    type="text" 
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-textPrimary">Bio / About Me</label>
                  <textarea 
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell clients about your experience and style..."
                    className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50" 
                    rows={4}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-textPrimary">Specialties (comma separated)</label>
                  <input 
                    name="specialties"
                    value={formData.specialties}
                    onChange={handleChange}
                    placeholder="Fades, Line-ups, Beard Trim"
                    className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50" 
                    type="text" 
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-textPrimary">Profile Photo</label>
                  <div className="flex items-center gap-6 p-4 border-2 border-dashed border-border rounded-xl bg-white">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                      <span className="material-symbols-outlined text-gray-400 text-3xl">image</span>
                    </div>
                    <div className="flex flex-col">
                      <button className="text-primary font-semibold hover:underline text-left">Click to replace photo</button>
                      <p className="text-sm text-gray-500">SVG, PNG or JPG (max. 800x800px)</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* WORKING HOURS */}
            <section className="bg-white border border-border rounded-xl shadow-sm p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary">schedule</span>
                <h3 className="text-xl font-semibold">Working Hours</h3>
              </div>
              
              <div className="space-y-4">
                {formData.workingHours.map((wh, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3 w-1/3">
                      <input 
                        type="checkbox"
                        checked={wh.isOpen}
                        onChange={(e) => handleWorkingHourChange(idx, 'isOpen', e.target.checked)}
                        className="w-5 h-5 text-primary rounded border-border focus:ring-primary" 
                      />
                      <span className="font-semibold text-textPrimary">{DAYS_OF_WEEK[wh.dayOfWeek]}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 w-2/3 justify-end">
                      <input 
                        type="time"
                        value={wh.openTime}
                        onChange={(e) => handleWorkingHourChange(idx, 'openTime', e.target.value)}
                        disabled={!wh.isOpen}
                        className="px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none disabled:opacity-50"
                      />
                      <span className="text-gray-500 font-semibold">to</span>
                      <input 
                        type="time"
                        value={wh.closeTime}
                        onChange={(e) => handleWorkingHourChange(idx, 'closeTime', e.target.value)}
                        disabled={!wh.isOpen}
                        className="px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Column Right: Billing & Shop Association */}
          <div className="md:col-span-5 flex flex-col gap-6">
            
            {/* BILLING & PAYOUTS */}
            <section className="bg-white border border-border rounded-xl shadow-sm p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                <h3 className="text-xl font-semibold">Billing &amp; Payouts</h3>
              </div>
              
              <div className="p-4 bg-primary/10 rounded-xl mb-6">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-3 py-1 bg-white text-primary rounded-full text-xs font-bold uppercase tracking-wider">Current Plan</span>
                  <p className="text-lg font-bold text-primary">Pro</p>
                </div>
                <h4 className="text-xl font-black text-primary">Commission Based</h4>
                <p className="text-sm text-primary/80 mt-1">{profile?.commissionRate ? (profile.commissionRate * 100).toFixed(0) : 10}% platform fee per booking.</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-600">payments</span>
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
                    {profile?.payoutMethodVerified ? (
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
            
            {/* SHOP ASSOCIATION */}
            <section className="bg-white border border-border rounded-xl shadow-sm p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary">storefront</span>
                <h3 className="text-xl font-semibold">Shop Association</h3>
              </div>
              
              <div className="space-y-4">
                {profile?.shopId ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4 p-4 border border-border rounded-xl">
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">store</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-textPrimary">{profile.shopName}</h4>
                        <p className="text-sm text-gray-500">Currently working here</p>
                      </div>
                      <button 
                        onClick={async () => {
                          try {
                            const res = await api.post('/conversations/initiate', { type: 'staff' });
                            if (res.data?.success) {
                              window.location.href = `/barber/messages/${res.data.data._id}`;
                            }
                          } catch (err) {
                            alert("Failed to initiate conversation with shop owner");
                          }
                        }}
                        className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors flex items-center justify-center"
                        title="Message Shop Owner"
                      >
                        <span className="material-symbols-outlined">chat</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 border border-border rounded-xl">
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-400">store</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-textPrimary">Independent</h4>
                      <p className="text-sm text-gray-500">Not linked to a shop</p>
                    </div>
                  </div>
                )}
                <button className="w-full py-3 bg-gray-50 text-textPrimary font-semibold rounded-xl border border-border hover:bg-gray-100 transition-colors">
                  {profile?.shopId ? 'Leave Shop' : 'Join a Shop'}
                </button>
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
