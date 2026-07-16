"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, PhoneInput, RoleCard, Input } from "@kinyozihub/ui";
import { GOOGLE_USER_FALLBACK_NAME } from "@kinyozihub/types";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [phone, setPhone] = useState(user?.phone?.startsWith('google_') ? '' : (user?.phone || ''));
  const [role, setRole] = useState(user?.role || "client");
  const [name, setName] = useState(user?.name === GOOGLE_USER_FALLBACK_NAME ? "" : (user?.name || ""));
  const needsName = user?.name === GOOGLE_USER_FALLBACK_NAME;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^\+254\d{9}$/.test(phone)) {
      setError("Please enter a valid Safaricom/Airtel number");
      return;
    }

    if (needsName && name.trim().length === 0) {
      setError("Please enter your full name");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/complete-onboarding", { 
        phone, 
        role,
        ...(needsName && { name: name.trim() })
      });

      // We don't need to manually update the context because a page reload or subsequent
      // calls will pick up the new role/phone, but we should just route them correctly.
      if (role === 'client') {
        window.location.href = '/client/dashboard';
      } else if (role === 'barber') {
        window.location.href = '/barber/dashboard';
      } else if (role === 'shop_owner') {
        window.location.href = '/shop/dashboard';
      } else {
        window.location.href = '/login';
      }

    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update profile. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    const defaultRole = user?.role || "client";
    if (defaultRole === 'client') {
      window.location.href = '/client/dashboard';
    } else if (defaultRole === 'barber') {
      window.location.href = '/barber/dashboard';
    } else if (defaultRole === 'shop_owner') {
      window.location.href = '/shop/dashboard';
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <main className="w-full max-w-[800px] mx-auto p-4 md:p-8 flex flex-col flex-grow mt-4 md:mt-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-textPrimary mb-2">
          Complete your profile
        </h1>
        <p className="text-base text-textPrimary/70">
          Tell us how you'll use KinyoziHub and provide your contact number.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8 flex-grow">
        {needsName && (
          <div className="flex flex-col space-y-1 mb-4">
            <label className="text-sm font-semibold text-textPrimary ml-1">
              Full Name
            </label>
            <Input
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-backgroundSecondary border-backgroundSecondary/20 focus:border-brandPrimary text-textPrimary"
            />
            <p className="text-xs text-textPrimary/50 ml-1 mt-1">
              Please provide your name to complete your profile.
            </p>
          </div>
        )}
        
        {/* Role Selection */}
        <div className="flex flex-col gap-4">
          <label className="text-sm font-semibold text-textPrimary ml-1">
            How will you use KinyoziHub?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RoleCard
              name="role"
              value="client"
              title="Client"
              description="Book appointments with top barbers"
              icon={<span className="material-symbols-outlined">content_cut</span>}
              selected={role === 'client'}
              onChange={(e) => {
                console.log("Client onChange fired, new value:", e.target.value);
                setRole(e.target.value);
              }}
              onClick={() => {
                console.log("Client onClick fired, setting to client");
                setRole("client");
              }}
            />
            <RoleCard
              name="role"
              value="barber"
              title="Barber"
              description="Manage your bookings and clients"
              icon={<span className="material-symbols-outlined">face</span>}
              selected={role === 'barber'}
              onChange={(e) => {
                console.log("Barber onChange fired, new value:", e.target.value);
                setRole(e.target.value);
              }}
              onClick={() => {
                console.log("Barber onClick fired, setting to barber");
                setRole("barber");
              }}
            />
            <RoleCard
              name="role"
              value="shop_owner"
              title="Shop Owner"
              description="Manage your shop and staff"
              icon={<span className="material-symbols-outlined">storefront</span>}
              selected={role === 'shop_owner'}
              onChange={(e) => {
                console.log("Shop owner onChange fired, new value:", e.target.value);
                setRole(e.target.value);
              }}
              onClick={() => {
                console.log("Shop owner onClick fired, setting to shop_owner");
                setRole("shop_owner");
              }}
            />
          </div>
        </div>

        {/* Phone Input */}
        <div className="flex flex-col space-y-1 mb-4">
          <label className="text-sm font-semibold text-textPrimary ml-1">
            Phone Number
          </label>
          <PhoneInput 
            placeholder="7XX XXX XXX" 
            value={phone.replace(/^\+254/, '')}
            onChange={(e) => setPhone(`+254${e.target.value.replace(/\D/g, '')}`)}
          />
          <p className="text-xs text-textPrimary/50 ml-1 mt-1">
            Used for notifications and booking updates.
          </p>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div className="mt-4 pb-4 space-y-3 max-w-[400px] mx-auto w-full">
          <Button 
            className="w-full" 
            disabled={!phone || !role || isLoading}
            type="submit"
          >
            {isLoading ? "Saving..." : "Complete Profile"}
          </Button>

          <Button 
            className="w-full"
            variant="outline"
            type="button"
            onClick={handleSkip}
            disabled={isLoading}
          >
            Skip for now
          </Button>
        </div>
      </form>
    </main>
  );
}
