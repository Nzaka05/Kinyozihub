'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, PhoneInput } from "@kinyozihub/ui";
import { api } from "@/lib/api";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default function RegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasGoogleToken, setHasGoogleToken] = useState(false);

  const PHONE_LOGIN_ENABLED = false; // Feature flag to hide phone/OTP login

  useEffect(() => {
    // Check on mount (and keep checking every 500ms just in case they authenticate while on this page)
    const checkToken = () => {
      if (sessionStorage.getItem('googleRegistrationToken')) {
        setHasGoogleToken(true);
      }
    };
    checkToken();
    const interval = setInterval(checkToken, 500);
    return () => clearInterval(interval);
  }, []);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^\+254\d{9}$/.test(phone)) {
      setError("Please enter a valid Safaricom/Airtel number");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/send-otp", { phone });
      // We pass the phone in the query string
      router.push(`/verify?phone=${encodeURIComponent(phone)}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full max-w-[400px] flex flex-col items-center mx-auto p-4 md:p-8">
      <div className="w-full text-center mb-8 mt-12">
        <h1 className="text-2xl font-semibold text-textPrimary mb-2">
          Welcome to KinyoziHub
        </h1>
        <p className="text-sm text-textPrimary/70">
          Book trusted barbers or grow your business — in minutes
        </p>
      </div>

      {hasGoogleToken && (
        <div className="w-full bg-green-50 border border-green-200 rounded-md p-4 mb-6 text-center">
          <p className="text-green-800 font-medium">Google account verified!</p>
          <p className="text-green-700 text-sm mt-1">Enter your phone number to complete registration.</p>
        </div>
      )}

      <form onSubmit={handlePhoneSubmit} className="w-full space-y-4">
        {(PHONE_LOGIN_ENABLED || hasGoogleToken) && (
          <>
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-semibold text-textPrimary ml-1">
                Phone Number
              </label>
              <PhoneInput 
                placeholder="7XX XXX XXX" 
                value={phone.replace(/^\+254/, '')}
                onChange={(e) => setPhone(`+254${e.target.value.replace(/\D/g, '')}`)}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button type="submit" className="w-full mt-4" disabled={isLoading}>
              {isLoading ? "Sending OTP..." : "Send Code"}
            </Button>
          </>
        )}

        {PHONE_LOGIN_ENABLED && !hasGoogleToken && (
          <div className="flex items-center space-x-4 py-4">
            <div className="flex-grow h-[1px] bg-border"></div>
            <span className="text-sm text-textPrimary/70">or</span>
            <div className="flex-grow h-[1px] bg-border"></div>
          </div>
        )}

        {!hasGoogleToken && (
          <GoogleSignInButton />
        )}
      </form>

      <footer className="mt-8 text-center pb-8">
        <p className="text-sm text-textPrimary/70">
          Already have an account? 
          <Link href="/login" className="text-textPrimary font-bold ml-1 hover:underline">Log in</Link>
        </p>
      </footer>
    </main>
  );
}

