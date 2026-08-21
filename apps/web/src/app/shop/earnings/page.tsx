"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface StaffBreakdown {
  barberName: string;
  barberProfileImage: string | null;
  weekGross: number;
  weekCommission: number;
}

interface ShopEarningsData {
  todayShopRevenue: number;
  weekShopGross: number;
  estimatedNextPayout: number;
  staffBreakdown: StaffBreakdown[];
}

export default function ShopEarningsPage() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<ShopEarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const res = await api.get("/shops/me/earnings");
        if (res.data?.success && res.data?.data) {
          setEarnings(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch shop earnings", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchEarnings();
    }
  }, [user]);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-on-surface-variant">Loading earnings...</div>;
  }

  const hasStaff = earnings && earnings.staffBreakdown.length > 0;
  const hasRevenue = earnings && (earnings.todayShopRevenue > 0 || earnings.weekShopGross > 0 || earnings.estimatedNextPayout > 0);

  if (!hasStaff) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-on-surface">Earnings</h1>
          <p className="text-sm text-on-surface-variant">Track commission revenue from your staff&apos;s completed appointments.</p>
        </div>
        <div className="text-center py-20 px-4 bg-surface border border-dashed border-outline-variant rounded-2xl space-y-3">
          <span className="material-symbols-outlined text-on-surface-variant text-5xl">group_off</span>
          <h2 className="text-lg font-semibold text-on-surface">No Staff Members Linked</h2>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto">
            Invite barbers to join your shop to start earning commission on their completed bookings.
          </p>
          <div className="pt-2">
            <Link
              href="/shop/staff-invites"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Generate Staff Invites
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Earnings</h1>
        <p className="text-sm text-on-surface-variant">Commission revenue from your staff&apos;s completed appointments.</p>
      </div>

      {/* Stat Cards — matching shop dashboard pattern */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        {/* Today's Shop Revenue */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-outline-variant flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-on-surface-variant">Today&apos;s Commission</span>
            <span className="material-symbols-outlined text-tertiary">today</span>
          </div>
          <p className="text-3xl font-semibold text-primary">KES {earnings!.todayShopRevenue.toLocaleString()}</p>
          <p className="text-[12px] text-on-surface-variant font-medium mt-2">From completed bookings today</p>
        </div>

        {/* Weekly Gross */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-outline-variant flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-on-surface-variant">Weekly Gross</span>
            <span className="material-symbols-outlined text-tertiary">payments</span>
          </div>
          <p className="text-3xl font-semibold text-on-surface">KES {earnings!.weekShopGross.toLocaleString()}</p>
          <p className="text-[12px] text-on-surface-variant font-medium mt-2">Total staff revenue this week</p>
        </div>

        {/* Estimated Next Payout */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-outline-variant flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-on-surface-variant">Est. Total Commission</span>
            <span className="material-symbols-outlined text-tertiary">account_balance_wallet</span>
          </div>
          <p className="text-3xl font-semibold text-primary">KES {earnings!.estimatedNextPayout.toLocaleString()}</p>
          <p className="text-[12px] text-on-surface-variant font-medium mt-2">Estimated — all time, all staff</p>
        </div>
      </section>

      {/* Staff Breakdown */}
      <section className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="p-6 border-b border-outline-variant">
          <h2 className="text-lg font-semibold text-on-surface">Staff Breakdown — This Week</h2>
          <p className="text-sm text-on-surface-variant">Per-barber revenue and your commission earned.</p>
        </div>

        {!hasRevenue ? (
          <div className="p-6 text-center text-on-surface-variant">
            No completed bookings this week yet. Revenue will appear here as appointments are completed.
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              <div className="col-span-5">Barber</div>
              <div className="col-span-3 text-right">Week Gross</div>
              <div className="col-span-4 text-right">Your Commission</div>
            </div>

            {earnings!.staffBreakdown.map((staff, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-surface-container-low transition-colors"
              >
                {/* Barber Info */}
                <div className="col-span-5 flex items-center gap-3">
                  {staff.barberProfileImage ? (
                    <img
                      src={staff.barberProfileImage}
                      alt={staff.barberName}
                      className="w-10 h-10 rounded-full object-cover border border-outline-variant"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center border border-primary/20 text-sm">
                      {staff.barberName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold text-on-surface text-sm">{staff.barberName}</span>
                </div>

                {/* Week Gross */}
                <div className="col-span-3 text-right">
                  <span className="font-semibold text-on-surface text-sm">
                    KES {staff.weekGross.toLocaleString()}
                  </span>
                </div>

                {/* Commission */}
                <div className="col-span-4 text-right">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                    staff.weekCommission > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    KES {staff.weekCommission.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}

            {/* Total Row */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center bg-surface-container-low font-bold">
              <div className="col-span-5 text-sm text-on-surface">Total</div>
              <div className="col-span-3 text-right text-sm text-on-surface">
                KES {earnings!.staffBreakdown.reduce((sum, s) => sum + s.weekGross, 0).toLocaleString()}
              </div>
              <div className="col-span-4 text-right">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-primary/10 text-primary">
                  KES {earnings!.staffBreakdown.reduce((sum, s) => sum + s.weekCommission, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 bg-tertiary-container border border-outline-variant rounded-xl text-sm text-on-tertiary-container">
        <span className="material-symbols-outlined text-tertiary text-[20px] mt-0.5">info</span>
        <p>
          Earnings are calculated from completed bookings only, bucketed by appointment date.
          &quot;Est. Total Commission&quot; is a computed figure across all staff and all time — not backed by a payout ledger.
          M-Pesa payout tracking is coming soon.
        </p>
      </div>
    </div>
  );
}
