"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface StaffService {
  _id: string;
  name: string;
  price: number;
  duration: string;
  isActive: boolean;
}

interface StaffMemberServices {
  barberId: string;
  barberName: string;
  barberProfileImage: string | null;
  services: StaffService[];
}

export default function ShopStaffServicesPage() {
  const { user } = useAuth();
  const [staffData, setStaffData] = useState<StaffMemberServices[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaffServices = async () => {
      try {
        setLoading(true);
        const res = await api.get("/shops/me/staff-services");
        if (res.data?.success && res.data?.data) {
          setStaffData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch staff services", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStaffServices();
    }
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Staff Services</h1>
        <p className="text-sm text-gray-500">
          View all grooming and styling services offered by your shop&apos;s barbers (read-only).
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500 bg-white border border-border rounded-xl">
          Loading staff services...
        </div>
      ) : staffData.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border border-dashed border-border rounded-xl space-y-3">
          <span className="material-symbols-outlined text-gray-400 text-5xl">group_off</span>
          <h2 className="text-lg font-semibold text-gray-900">No Staff Members Linked</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Invite barbers to join your shop using staff invite codes to view their service offerings here.
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
          {staffData.map((staff) => (
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
                      {staff.services.length} {staff.services.length === 1 ? "service" : "services"} listed
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full uppercase tracking-wider">
                  Staff Barber
                </span>
              </div>

              {/* Barber Services List */}
              <div className="p-6">
                {staff.services.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    No services added yet by this barber.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {staff.services.map((svc) => (
                      <div
                        key={svc._id}
                        className={`p-4 rounded-xl border flex items-center justify-between ${
                          svc.isActive ? "bg-white border-gray-200" : "bg-gray-50 opacity-75 border-gray-200"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 text-sm">{svc.name}</h3>
                            {!svc.isActive && (
                              <span className="text-[10px] px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full font-medium">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="text-primary font-semibold">KES {svc.price}</span>
                            <span>•</span>
                            <span>{svc.duration}</span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 text-[20px]">
                          content_cut
                        </span>
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
