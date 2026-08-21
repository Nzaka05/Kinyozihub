"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface StaffPortfolio {
  barberId: string;
  barberName: string;
  barberProfileImage: string | null;
  portfolioImages: string[];
}

export default function ShopStaffPortfolioPage() {
  const { user } = useAuth();
  const [staffPortfolios, setStaffPortfolios] = useState<StaffPortfolio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaffPortfolios = async () => {
      try {
        setLoading(true);
        const res = await api.get("/shops/me/staff-portfolios");
        if (res.data?.success && res.data?.data) {
          setStaffPortfolios(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch staff portfolios", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStaffPortfolios();
    }
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Staff Portfolios</h1>
        <p className="text-sm text-gray-500">
          Browse showcase haircut and grooming samples uploaded by your shop&apos;s staff (read-only).
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500 bg-white border border-border rounded-xl">
          Loading staff portfolios...
        </div>
      ) : staffPortfolios.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border border-dashed border-border rounded-xl space-y-3">
          <span className="material-symbols-outlined text-gray-400 text-5xl">photo_library</span>
          <h2 className="text-lg font-semibold text-gray-900">No Staff Members Linked</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Invite barbers to join your shop using staff invite codes to view their portfolio galleries here.
          </p>
          <div className="pt-2">
            <Link
              href="/shop/staff-invites"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Generate Staff Invites
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {staffPortfolios.map((staff) => (
            <div
              key={staff.barberId}
              className="bg-white border border-border rounded-xl shadow-sm overflow-hidden"
            >
              {/* Barber Header */}
              <div className="p-6 bg-gray-50/50 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {staff.barberProfileImage ? (
                    <img
                      src={staff.barberProfileImage}
                      alt={staff.barberName}
                      className="w-12 h-12 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center border border-primary/20 text-base">
                      {staff.barberName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{staff.barberName}</h2>
                    <p className="text-xs text-gray-500">
                      {staff.portfolioImages.length}{" "}
                      {staff.portfolioImages.length === 1 ? "work sample" : "work samples"}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full uppercase tracking-wider">
                  Staff Barber
                </span>
              </div>

              {/* Barber Portfolio Gallery */}
              <div className="p-6">
                {staff.portfolioImages.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    No portfolio photos uploaded yet by this barber.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {staff.portfolioImages.map((url, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-gray-100 shadow-sm"
                      >
                        <img
                          src={url}
                          alt={`${staff.barberName} work sample ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://placehold.co/400x400/f3f4f6/9ca3af?text=Image+Unavailable";
                          }}
                        />
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] font-bold rounded">
                          #{idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
