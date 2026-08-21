"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface EarningsData {
  today: { gross: number; net: number };
  week: { gross: number; net: number };
  allTime: { gross: number; net: number };
  growthPercent: number;
  completedBookingsCount: number;
  commissionRate: number;
}

export default function BarberEarningsPage() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const res = await api.get("/barbers/me/earnings");
        if (res.data?.success && res.data?.data) {
          setEarnings(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch earnings", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchEarnings();
    }
  }, [user]);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-gray-500">Loading earnings...</div>;
  }

  if (!earnings || earnings.completedBookingsCount === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-textPrimary">Earnings</h1>
          <p className="text-sm text-gray-500">Track your revenue from completed appointments.</p>
        </div>
        <div className="text-center py-20 px-4 bg-white border border-dashed border-border rounded-2xl space-y-3">
          <span className="material-symbols-outlined text-gray-400 text-5xl">payments</span>
          <h2 className="text-lg font-semibold text-textPrimary">No Earnings Yet</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Complete your first appointment to start tracking your earnings here. Only completed bookings count toward your revenue.
          </p>
        </div>
      </div>
    );
  }

  const commissionPercent = Math.round(earnings.commissionRate * 100);
  const hasCommission = earnings.commissionRate > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Earnings</h1>
          <p className="text-sm text-gray-500">Revenue from completed appointments.</p>
        </div>
        {/* Commission badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${hasCommission ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          <span className="material-symbols-outlined text-[18px]">{hasCommission ? 'storefront' : 'check_circle'}</span>
          {hasCommission
            ? `${commissionPercent}% shop commission applied`
            : "No commission — you keep 100%"
          }
        </div>
      </div>

      {/* Stat Cards — matching dashboard pattern */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Today's Net Earnings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Today&apos;s Earnings</span>
            <span className="material-symbols-outlined text-secondary">today</span>
          </div>
          <p className="text-3xl font-semibold text-primary">KES {earnings.today.net.toLocaleString()}</p>
          {hasCommission && (
            <p className="text-[11px] text-gray-400 mt-2">Gross: KES {earnings.today.gross.toLocaleString()}</p>
          )}
          {!hasCommission && (
            <p className="text-[12px] text-gray-500 font-medium mt-2">Net take-home</p>
          )}
        </div>

        {/* This Week */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">This Week</span>
            <span className="material-symbols-outlined text-secondary">payments</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-semibold text-primary">KES {earnings.week.net.toLocaleString()}</p>
            {earnings.growthPercent !== 0 && (
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                earnings.growthPercent > 0
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {earnings.growthPercent > 0 ? 'trending_up' : 'trending_down'}
                </span>
                {earnings.growthPercent > 0 ? '+' : ''}{earnings.growthPercent}%
              </span>
            )}
          </div>
          <p className="text-[12px] text-gray-500 font-medium mt-2">vs. last week</p>
        </div>

        {/* All-Time */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">All-Time Earnings</span>
            <span className="material-symbols-outlined text-secondary">account_balance_wallet</span>
          </div>
          <p className="text-3xl font-semibold text-textPrimary">KES {earnings.allTime.net.toLocaleString()}</p>
          {hasCommission && (
            <p className="text-[11px] text-gray-400 mt-2">Gross: KES {earnings.allTime.gross.toLocaleString()}</p>
          )}
          {!hasCommission && (
            <p className="text-[12px] text-gray-500 font-medium mt-2">Total earned</p>
          )}
        </div>

        {/* Completed Appointments */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Completed Appointments</span>
            <span className="material-symbols-outlined text-secondary">event_available</span>
          </div>
          <p className="text-3xl font-semibold text-textPrimary">{earnings.completedBookingsCount}</p>
          <p className="text-[12px] text-gray-500 font-medium mt-2">All time</p>
        </div>
      </section>

      {/* Earnings Breakdown */}
      {hasCommission && (
        <section className="bg-white rounded-2xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold text-textPrimary mb-4">Commission Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 rounded-xl border border-border">
              <p className="text-sm text-gray-500 mb-1">This Week Gross</p>
              <p className="text-xl font-semibold text-textPrimary">KES {earnings.week.gross.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
              <p className="text-sm text-orange-600 mb-1">Shop Commission ({commissionPercent}%)</p>
              <p className="text-xl font-semibold text-orange-700">
                − KES {(earnings.week.gross - earnings.week.net).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-sm text-green-600 mb-1">Your Net Take-Home</p>
              <p className="text-xl font-semibold text-green-700">KES {earnings.week.net.toLocaleString()}</p>
            </div>
          </div>
        </section>
      )}

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
        <span className="material-symbols-outlined text-blue-600 text-[20px] mt-0.5">info</span>
        <p>
          Earnings are calculated from completed bookings only, bucketed by appointment date.
          {hasCommission && ` A ${commissionPercent}% commission is deducted by your shop.`}
          {' '}Payout tracking via M-Pesa is coming soon.
        </p>
      </div>
    </div>
  );
}
