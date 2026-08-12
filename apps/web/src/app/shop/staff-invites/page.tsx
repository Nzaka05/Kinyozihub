'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Invite {
  _id: string;
  code: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
}

export default function StaffInvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [barberCount, setBarberCount] = useState(0);
  const [barberLimit, setBarberLimit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      setLoading(true);
      const response = await api.get('/shops/me/invites');
      if (response.data.success) {
        setInvites(response.data.data.invites);
        setBarberCount(response.data.data.barberCount);
        setBarberLimit(response.data.data.barberLimit);
      } else {
        setError(response.data.message || 'Failed to load invites');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error loading invites');
    } finally {
      setLoading(false);
    }
  };

  const generateInvite = async () => {
    try {
      setGenerating(true);
      const response = await api.post('/shops/me/invites');
      if (response.data.success) {
        await navigator.clipboard.writeText(response.data.inviteCode);
        alert(`New invite generated and copied to clipboard: ${response.data.inviteCode}`);
        fetchInvites(); // Refresh list
      } else {
        alert(response.data.message || 'Failed to generate invite');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error generating invite');
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  const capacityPercentage = Math.min(100, Math.round((barberCount / Math.max(1, barberLimit)) * 100));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="w-full top-0 sticky z-40 bg-white/95 backdrop-blur-md flex justify-between items-center px-4 py-4 border-b border-border shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Staff Invites</h1>
      </header>

      <div className="p-4 flex flex-col gap-6">
        {/* Team Capacity Section */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Team Capacity</h2>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{barberCount} of {barberLimit} slots used</span>
            <span>{capacityPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${capacityPercentage >= 100 ? 'bg-red-500' : 'bg-primary'}`} 
              style={{ width: `${capacityPercentage}%` }}
            ></div>
          </div>
        </section>

        {/* Action Button */}
        <button 
          onClick={generateInvite}
          disabled={generating || barberCount >= barberLimit}
          className="w-full bg-primary text-white rounded-xl py-3 font-semibold disabled:opacity-50 active:scale-95 transition-all"
        >
          {generating ? 'Generating...' : 'Invite New Staff'}
        </button>

        {/* Invites List */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sent Invites</h2>
          
          {invites.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No invites sent yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {invites.map(invite => (
                <div key={invite._id} className="flex justify-between items-center pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="font-medium font-mono text-gray-900">{invite.code}</span>
                    <span className="text-xs text-gray-500">{new Date(invite.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      invite.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      invite.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                    </span>
                    
                    {invite.status === 'pending' && (
                      <button 
                        onClick={() => copyCode(invite.code)}
                        className="text-sm text-primary font-semibold hover:underline"
                      >
                        Resend
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
