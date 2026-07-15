"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, OtpInput } from "@kinyozihub/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "";
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  // If no phone is present, redirect back to login
  useEffect(() => {
    if (!phone) {
      router.push("/login");
    }
  }, [phone, router]);

  const handleVerify = async () => {
    if (otp.length !== 4) return;
    
    setIsLoading(true);
    setError("");

    try {
      const googleRegistrationToken = sessionStorage.getItem("googleRegistrationToken") || undefined;
      
      const { data } = await api.post("/auth/verify-otp", {
        phone,
        code: otp,
        googleRegistrationToken
      });

      if (data.isNewUser) {
        // Save the temporary token needed for the final /register step
        sessionStorage.setItem("registrationToken", data.registrationToken);
        router.push("/role-selection");
      } else {
        // Logged in successfully
        sessionStorage.removeItem("googleRegistrationToken"); // Clean up
        login(data.accessToken, data.user);
        
        // Route based on role
        if (data.user.role === 'client') {
          router.push("/client/dashboard");
        } else if (data.user.role === 'barber') {
          router.push("/barber/dashboard");
        } else if (data.user.role === 'shop_owner') {
          router.push("/shop/dashboard");
        } else {
          console.error("Unrecognized role returned from API:", data.user.role);
          router.push("/login");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Headers */}
      <div className="mb-8 text-left">
        <h1 className="text-3xl font-bold text-textPrimary mb-2">
          Enter the code
        </h1>
        <p className="text-base text-textPrimary/70">
          We sent a 4-digit code to {phone}
          <button 
            onClick={() => router.back()} 
            className="text-primary font-bold underline ml-1 hover:opacity-80 transition-opacity"
          >
            Change number
          </button>
        </p>
      </div>

      {/* OTP Input Group */}
      <div className="mb-8 w-full max-w-[320px] mx-auto">
        <OtpInput length={4} value={otp} onChange={setOtp} />
      </div>

      {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

      {/* Resend Logic */}
      <div className="text-center mb-8">
        <p className="text-sm text-textPrimary/70">
          Resend code in <span className="font-bold text-textPrimary">0:45</span>
        </p>
      </div>

      {/* Action Area */}
      <div className="mt-auto md:mt-0 w-full pb-4 md:pb-0">
        <Button 
          className="w-full" 
          disabled={otp.length !== 4 || isLoading} 
          onClick={handleVerify}
        >
          {isLoading ? "Verifying..." : "Verify"}
        </Button>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="w-full max-w-[480px] mx-auto p-4 md:p-8 flex flex-col items-center flex-grow mt-12 md:mt-20">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyContent />
      </Suspense>
    </main>
  );
}
