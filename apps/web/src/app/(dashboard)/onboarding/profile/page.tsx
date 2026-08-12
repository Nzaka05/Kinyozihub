"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, PhoneInput, RoleCard, Input } from "@kinyozihub/ui";
import { GOOGLE_USER_FALLBACK_NAME, UserRole } from "@kinyozihub/types";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 State
  const [phone, setPhone] = useState(user?.phone?.startsWith('google_') ? '' : (user?.phone || ''));
  const [role, setRole] = useState(user?.role || "client");
  const [name, setName] = useState(user?.name === GOOGLE_USER_FALLBACK_NAME ? "" : (user?.name || ""));
  const needsName = user?.name === GOOGLE_USER_FALLBACK_NAME;

  // Step 2 State (Location)
  const [area, setArea] = useState("");

  // Step 3 State (Working Hours)
  const [workingHours, setWorkingHours] = useState(
    [0, 1, 2, 3, 4, 5, 6].map(day => ({
      dayOfWeek: day,
      isOpen: day >= 1 && day <= 5, // Mon-Fri open by default
      openTime: "08:00",
      closeTime: "18:00"
    }))
  );

  // Step 4 State (Services)
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceDuration, setServiceDuration] = useState("45 min");

  // Step 5 State (Portfolio)
  const [portfolioUrls, setPortfolioUrls] = useState(["", "", ""]);

  const handleStep1Submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
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

      setIsLoading(false);
      
      if (role === 'client') {
        window.location.href = '/client/dashboard';
      } else if (role === 'shop_owner') {
        window.location.href = '/shop/dashboard';
      } else {
        setCurrentStep(2); // Barber proceeds to step 2
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update profile. Please try again.");
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (area.trim()) {
        await api.put("/barbers/me/settings", { area });
      }
      setIsLoading(false);
      setCurrentStep(3);
    } catch (err: any) {
      setError("Failed to save location. Please try again.");
      setIsLoading(false);
    }
  };

  const handleStep3Submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await api.put("/barbers/me/settings", { workingHours });
      setIsLoading(false);
      setCurrentStep(4);
    } catch (err: any) {
      setError("Failed to save working hours. Please try again.");
      setIsLoading(false);
    }
  };

  const handleStep4Submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (serviceName && servicePrice) {
        await api.post('/services', {
          name: serviceName,
          price: Number(servicePrice),
          duration: serviceDuration
        });
      }
      setIsLoading(false);
      setCurrentStep(5);
    } catch (err: any) {
      setError("Failed to save service. Please try again.");
      setIsLoading(false);
    }
  };

  const handleStep5Submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const validUrls = portfolioUrls.filter(url => url.trim() !== "");
      if (validUrls.length > 0) {
        await api.put("/barbers/me/settings", { portfolioImages: validUrls });
      }
      setIsLoading(false);
      window.location.href = '/barber/dashboard';
    } catch (err: any) {
      setError("Failed to save portfolio. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (currentStep === 1) {
      const defaultRole = user?.role || "client";
      if (defaultRole === 'client') {
        window.location.href = '/client/dashboard';
      } else if (defaultRole === 'shop_owner') {
        window.location.href = '/shop/dashboard';
      } else if (defaultRole === 'barber') {
        window.location.href = '/barber/dashboard';
      } else {
        window.location.href = '/login';
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    } else if (currentStep === 5) {
      window.location.href = '/barber/dashboard';
    }
  };

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <main className="w-full max-w-[800px] mx-auto p-4 md:p-8 flex flex-col flex-grow mt-4 md:mt-8">
      {currentStep === 1 && (
        <>
          <div className="mb-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-textPrimary mb-2">
              Complete your profile
            </h1>
            <p className="text-base text-textPrimary/70">
              Tell us how you'll use KinyoziHub and provide your contact number.
            </p>
          </div>

          <form onSubmit={handleStep1Submit} className="flex flex-col gap-8 flex-grow">
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
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  onClick={() => setRole("client")}
                />
                <RoleCard
                  name="role"
                  value="barber"
                  title="Barber"
                  description="Manage your bookings and clients"
                  icon={<span className="material-symbols-outlined">face</span>}
                  selected={role === 'barber'}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  onClick={() => setRole("barber")}
                />
                <RoleCard
                  name="role"
                  value="shop_owner"
                  title="Shop Owner"
                  description="Manage your shop and staff"
                  icon={<span className="material-symbols-outlined">storefront</span>}
                  selected={role === 'shop_owner'}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  onClick={() => setRole("shop_owner")}
                />
              </div>
            </div>

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
                {isLoading ? "Saving..." : "Continue"}
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
        </>
      )}

      {currentStep === 2 && (
        <>
          <div className="mb-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-textPrimary mb-2">
              Where are you located?
            </h1>
            <p className="text-base text-textPrimary/70">
              Add your area or neighborhood so clients can find you.
            </p>
          </div>
          <form onSubmit={handleStep2Submit} className="flex flex-col gap-8 flex-grow">
            <div className="flex flex-col space-y-1 mb-4">
              <label className="text-sm font-semibold text-textPrimary ml-1">
                Area / Neighborhood
              </label>
              <Input
                placeholder="e.g. Westlands, Nairobi"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="bg-backgroundSecondary border-backgroundSecondary/20 focus:border-brandPrimary text-textPrimary"
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div className="mt-4 pb-4 space-y-3 max-w-[400px] mx-auto w-full">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Continue"}
              </Button>
              <Button className="w-full" variant="outline" type="button" onClick={handleSkip} disabled={isLoading}>
                Skip this step
              </Button>
            </div>
          </form>
        </>
      )}

      {currentStep === 3 && (
        <>
          <div className="mb-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-textPrimary mb-2">
              Set your working hours
            </h1>
            <p className="text-base text-textPrimary/70">
              When are you available for bookings?
            </p>
          </div>
          <form onSubmit={handleStep3Submit} className="flex flex-col gap-6 flex-grow">
            <div className="space-y-4">
              {workingHours.map((wh, index) => (
                <div key={wh.dayOfWeek} className="flex items-center gap-4 bg-backgroundSecondary/50 p-4 rounded-xl border border-border">
                  <div className="w-24 font-semibold text-textPrimary">
                    {daysOfWeek[wh.dayOfWeek]}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={wh.isOpen}
                      onChange={(e) => {
                        const newHours = [...workingHours];
                        newHours[index] = { ...newHours[index], isOpen: e.target.checked };
                        setWorkingHours(newHours);
                      }}
                      className="w-5 h-5 text-brandPrimary rounded border-border focus:ring-brandPrimary"
                    />
                    <label className="text-sm font-medium text-textPrimary/80">Open</label>
                  </div>
                  {wh.isOpen && (
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        type="time"
                        value={wh.openTime}
                        onChange={(e) => {
                          const newHours = [...workingHours];
                          newHours[index] = { ...newHours[index], openTime: e.target.value };
                          setWorkingHours(newHours);
                        }}
                        className="bg-backgroundSecondary border-backgroundSecondary/20"
                      />
                      <span className="text-textPrimary/50">to</span>
                      <Input
                        type="time"
                        value={wh.closeTime}
                        onChange={(e) => {
                          const newHours = [...workingHours];
                          newHours[index] = { ...newHours[index], closeTime: e.target.value };
                          setWorkingHours(newHours);
                        }}
                        className="bg-backgroundSecondary border-backgroundSecondary/20"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div className="mt-4 pb-4 space-y-3 max-w-[400px] mx-auto w-full">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Continue"}
              </Button>
              <Button className="w-full" variant="outline" type="button" onClick={handleSkip} disabled={isLoading}>
                Skip this step
              </Button>
            </div>
          </form>
        </>
      )}

      {currentStep === 4 && (
        <>
          <div className="mb-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-textPrimary mb-2">
              Add a Service
            </h1>
            <p className="text-base text-textPrimary/70">
              Add at least one service so clients can book you.
            </p>
          </div>
          <form onSubmit={handleStep4Submit} className="flex flex-col gap-6 flex-grow">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-textPrimary ml-1">Service Name</label>
              <Input 
                type="text" 
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. Signature Fade"
                className="bg-backgroundSecondary border-backgroundSecondary/20"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-sm font-semibold text-textPrimary ml-1">Price (KES)</label>
                <Input 
                  type="number" 
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  placeholder="e.g. 1000"
                  className="bg-backgroundSecondary border-backgroundSecondary/20"
                />
              </div>
              
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-sm font-semibold text-textPrimary ml-1">Duration</label>
                <select
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-backgroundSecondary/20 focus:ring-2 focus:ring-brandPrimary focus:outline-none bg-backgroundSecondary appearance-none text-textPrimary"
                >
                  <option value="15 min">15 min</option>
                  <option value="30 min">30 min</option>
                  <option value="45 min">45 min</option>
                  <option value="60 min">60 min</option>
                  <option value="90 min">90 min</option>
                  <option value="120 min">120 min</option>
                </select>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div className="mt-4 pb-4 space-y-3 max-w-[400px] mx-auto w-full">
              <Button className="w-full" type="submit" disabled={isLoading || (!serviceName || !servicePrice)}>
                {isLoading ? "Saving..." : "Continue"}
              </Button>
              <Button className="w-full" variant="outline" type="button" onClick={handleSkip} disabled={isLoading}>
                Skip this step
              </Button>
            </div>
          </form>
        </>
      )}

      {currentStep === 5 && (
        <>
          <div className="mb-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-textPrimary mb-2">
              Add Portfolio Images
            </h1>
            <p className="text-base text-textPrimary/70">
              Showcase your work by pasting image URLs.
            </p>
          </div>
          <form onSubmit={handleStep5Submit} className="flex flex-col gap-6 flex-grow">
            <div className="space-y-4">
              {portfolioUrls.map((url, index) => (
                <div key={index} className="flex flex-col space-y-1">
                  <label className="text-sm font-semibold text-textPrimary ml-1">
                    Image URL {index + 1}
                  </label>
                  <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={url}
                    onChange={(e) => {
                      const newUrls = [...portfolioUrls];
                      newUrls[index] = e.target.value;
                      setPortfolioUrls(newUrls);
                    }}
                    className="bg-backgroundSecondary border-backgroundSecondary/20"
                  />
                </div>
              ))}
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div className="mt-4 pb-4 space-y-3 max-w-[400px] mx-auto w-full">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Finish Onboarding"}
              </Button>
              <Button className="w-full" variant="outline" type="button" onClick={handleSkip} disabled={isLoading}>
                Skip & Finish
              </Button>
            </div>
          </form>
        </>
      )}
    </main>
  );
}
