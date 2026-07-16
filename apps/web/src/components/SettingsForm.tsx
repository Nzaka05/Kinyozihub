"use client";

import { useState } from "react";
import { Button, Input } from "@kinyozihub/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function SettingsForm() {
  const { user, login } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (name.trim().length === 0) {
      setMessage({ text: "Display name is required", type: "error" });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.put("/auth/me", { name: name.trim() });
      
      if (response.data.success) {
        setMessage({ text: "Profile updated successfully!", type: "success" });
        // Update user context manually so changes reflect immediately without full reload
        // Wait, login function usually requires the token, but we might just want to 
        // reload if there's no updateContext function.
        // If there's an update method in AuthContext, we would use it, but since we don't 
        // have one right now, we can just do a window.location.reload() for simplicity, 
        // or just let it be (the context will refresh on next hard load).
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err: any) {
      setMessage({ 
        text: err.response?.data?.error || "Failed to update profile", 
        type: "error" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-backgroundSecondary/30 border border-backgroundSecondary/50 rounded-xl p-6">
      <h2 className="text-xl font-bold text-textPrimary mb-6">Edit Profile</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-textPrimary">
            Display Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="bg-backgroundSecondary border-backgroundSecondary/20 focus:border-brandPrimary text-textPrimary"
          />
          <p className="text-xs text-textPrimary/50">
            This is the name clients and shops will see.
          </p>
        </div>

        {/* Future expansion: Profile Image, Email, etc. */}

        {message.text && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'error' 
              ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
              : 'bg-green-500/10 text-green-500 border border-green-500/20'
          }`}>
            {message.text}
          </div>
        )}

        <Button 
          type="submit" 
          disabled={isLoading || name.trim() === user?.name}
          className="w-full sm:w-auto px-8"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
