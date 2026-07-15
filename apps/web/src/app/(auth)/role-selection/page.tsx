"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, RoleCard } from "@kinyozihub/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function RoleSelectionPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [selectedRole, setSelectedRole] = useState<"client" | "barber" | "shop_owner" | null>(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("registrationToken");
    if (!token) {
      router.push("/login");
    } else {
      setRegistrationToken(token);
    }
  }, [router]);

  const handleSubmit = async () => {
    if (!selectedRole || !name.trim()) {
      setError("Please provide your name and select a role");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const googleRegistrationToken = sessionStorage.getItem("googleRegistrationToken") || undefined;

      const { data } = await api.post(
        "/auth/register",
        {
          name: name.trim(),
          role: selectedRole,
          googleRegistrationToken
        },
        {
          headers: {
            Authorization: `Bearer ${registrationToken}`
          }
        }
      );

      // Clean up temp tokens
      sessionStorage.removeItem("registrationToken");
      sessionStorage.removeItem("googleRegistrationToken");

      // Log in and route
      login(data.accessToken, data.user);
      
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

    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to complete registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!registrationToken) {
    return null; // Or a loading spinner while checking sessionStorage
  }

  return (
    <main className="w-full max-w-[600px] mx-auto p-4 md:p-8 flex flex-col flex-grow mt-12 md:mt-20">
      <div className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-textPrimary mb-2">
          Complete your profile
        </h1>
        <p className="text-base text-textPrimary/70">
          How will you use KinyoziHub?
        </p>
      </div>

      <div className="flex flex-col gap-4 flex-grow">
        <div className="flex flex-col space-y-1 mb-4">
          <label className="text-sm font-semibold text-textPrimary ml-1">
            Full Name
          </label>
          <input
            type="text"
            className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-textPrimary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <RoleCard 
          name="role"
          value="client"
          title="I'm a Client"
          description="Discover and book trusted barbers near you"
          selected={selectedRole === "client"}
          onChange={() => setSelectedRole("client")}
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="currentColor"/></svg>}
        />
        
        <RoleCard 
          name="role"
          value="barber"
          title="I'm a Barber"
          description="Build your profile, manage bookings, grow your income"
          selected={selectedRole === "barber"}
          onChange={() => setSelectedRole("barber")}
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.75 12C9.75 13.24 8.74 14.25 7.5 14.25C6.26 14.25 5.25 13.24 5.25 12C5.25 10.76 6.26 9.75 7.5 9.75C8.74 9.75 9.75 10.76 9.75 12ZM14.25 9.75C13.01 9.75 12 10.76 12 12C12 13.24 13.01 14.25 14.25 14.25C15.49 14.25 16.5 13.24 16.5 12C16.5 10.76 15.49 9.75 14.25 9.75ZM6 2C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V4C20 2.9 19.1 2 18 2H6ZM18 20H6V4H18V20Z" fill="currentColor"/></svg>}
        />

        <RoleCard 
          name="role"
          value="shop_owner"
          title="I'm a Shop Owner"
          description="Manage your team and track earnings in one place"
          selected={selectedRole === "shop_owner"}
          onChange={() => setSelectedRole("shop_owner")}
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 5H3V7H21V5ZM21 9H3V11H21V9ZM21 13H3V15H21V13ZM21 17H3V19H21V17Z" fill="currentColor"/></svg>}
        />
      </div>

      {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}

      <div className="mt-8 pb-4">
        <Button 
          className="w-full" 
          disabled={!selectedRole || !name.trim() || isLoading}
          onClick={handleSubmit}
        >
          {isLoading ? "Creating account..." : "Complete Registration"}
        </Button>
      </div>
    </main>
  );
}
