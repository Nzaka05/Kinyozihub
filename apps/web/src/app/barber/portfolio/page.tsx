"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function BarberPortfolioPage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [slotErrors, setSlotErrors] = useState<{ [key: number]: string }>({});
  const [showToast, setShowToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const targetSlotRef = useRef<number | null>(null);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await api.get("/barbers/me");
      if (res.data?.success && res.data?.data) {
        const fetchedImages: string[] = res.data.data.portfolioImages || [];
        if (fetchedImages.length > 6) {
          console.warn(
            `Barber has ${fetchedImages.length} portfolio images saved. Displaying first 6 in the bento grid.`
          );
        }
        const newSlots = Array(6).fill("");
        fetchedImages.slice(0, 6).forEach((img, idx) => {
          newSlots[idx] = img;
        });
        setSlots(newSlots);
      }
    } catch (err) {
      console.error("Failed to load portfolio images", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPortfolio();
    }
  }, [user]);

  const handleSlotClick = (index: number) => {
    // If empty or user wants to replace
    targetSlotRef.current = index;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const slotIdx = targetSlotRef.current;
    if (!file || slotIdx === null) return;

    try {
      setUploadingIndex(slotIdx);
      setSlotErrors((prev) => {
        const copy = { ...prev };
        delete copy[slotIdx];
        return copy;
      });

      // 1. Get signature from backend
      const sigRes = await api.get("/uploads/cloudinary-signature");
      if (!sigRes.data?.success || !sigRes.data?.data) {
        throw new Error("Failed to get upload authorization");
      }

      const { signature, timestamp, apiKey, cloudName, folder } = sigRes.data.data;

      // 2. Direct upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error?.message || "Cloudinary upload failed");
      }

      const secureUrl = uploadData.secure_url;
      if (!secureUrl) {
        throw new Error("No image URL returned from upload");
      }

      // 3. Put into slot
      setSlots((prev) => {
        const next = [...prev];
        next[slotIdx] = secureUrl;
        return next;
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      setSlotErrors((prev) => ({
        ...prev,
        [slotIdx]: err.message || "Upload failed. Please try again.",
      }));
    } finally {
      setUploadingIndex(null);
      targetSlotRef.current = null;
    }
  };

  const handleRemoveImage = (indexToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSlots((prev) => {
      const next = [...prev];
      next[indexToRemove] = "";
      return next;
    });
    setSlotErrors((prev) => {
      const copy = { ...prev };
      delete copy[indexToRemove];
      return copy;
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const filteredImages = slots.filter((url) => Boolean(url && url.trim()));
      const res = await api.put("/barbers/me/settings", {
        portfolioImages: filteredImages,
      });
      if (res.data?.success || res.data?.data) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save portfolio images", err);
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const filledCount = slots.filter((s) => Boolean(s && s.trim())).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Show off your work</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add at least 3 photos. Profiles with more photos get more bookings.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || loading || uploadingIndex !== null}
          className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[20px]">save</span>
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Photo Count Status Indicator */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-container-low border border-outline-variant text-sm">
        <span
          className={`material-symbols-outlined text-[20px] ${
            filledCount >= 3 ? "text-green-600" : "text-amber-600"
          }`}
        >
          {filledCount >= 3 ? "check_circle" : "info"}
        </span>
        <p className="text-on-surface-variant font-medium">
          {filledCount >= 3 ? (
            <span className="text-green-700 font-semibold">
              {filledCount} photos uploaded — your portfolio meets the recommended minimum.
            </span>
          ) : (
            <span>
              <strong className="text-on-surface font-semibold">{filledCount} of 3 required photos</strong> uploaded. Add at least {3 - filledCount} more.
            </span>
          )}
        </p>
      </div>

      {/* Bento Grid (3x2) */}
      <div className="bg-white border border-border rounded-xl shadow-sm p-6">
        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading portfolio photos...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {slots.map((url, index) => {
              const isCover = index === 0;
              const isRequired = index < 3;
              const isUploading = uploadingIndex === index;
              const hasError = slotErrors[index];
              const hasImage = Boolean(url && url.trim());

              return (
                <div
                  key={index}
                  onClick={() => !isUploading && handleSlotClick(index)}
                  className={`group relative aspect-square rounded-xl border-2 transition-all flex flex-col items-center justify-center overflow-hidden cursor-pointer ${
                    hasImage
                      ? "border-border bg-gray-100 shadow-sm"
                      : hasError
                      ? "border-error/50 bg-error-container/20 hover:border-error"
                      : "border-dashed border-outline-variant bg-surface-container hover:border-primary hover:bg-surface-container-high"
                  }`}
                >
                  {/* Required Indicator */}
                  {isRequired && !hasImage && !isUploading && (
                    <span className="absolute top-2 right-2 text-primary text-xl font-bold leading-none select-none">
                      *
                    </span>
                  )}

                  {/* Uploading Spinner */}
                  {isUploading && (
                    <div className="flex flex-col items-center justify-center gap-2 p-3 text-center">
                      <span className="material-symbols-outlined animate-spin text-primary text-3xl">
                        progress_activity
                      </span>
                      <span className="text-xs font-semibold text-gray-600">Uploading...</span>
                    </div>
                  )}

                  {/* Error State */}
                  {!isUploading && hasError && !hasImage && (
                    <div className="flex flex-col items-center justify-center p-3 text-center gap-1">
                      <span className="material-symbols-outlined text-error text-2xl">error</span>
                      <span className="text-[11px] text-error font-semibold line-clamp-2">{hasError}</span>
                      <span className="text-[10px] text-primary font-bold mt-1 underline">Click to retry</span>
                    </div>
                  )}

                  {/* Empty Slot Placeholder */}
                  {!isUploading && !hasError && !hasImage && (
                    <div className="flex flex-col items-center justify-center text-center p-4">
                      <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-3xl mb-1">
                        {isCover ? "add_a_photo" : "add"}
                      </span>
                      {isCover ? (
                        <span className="font-label-bold text-xs text-on-surface-variant group-hover:text-primary font-semibold">
                          Cover Photo
                        </span>
                      ) : (
                        <span className="font-label-bold text-[11px] text-on-surface-variant/70 group-hover:text-primary">
                          {isRequired ? "Photo " + (index + 1) : "Optional"}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Filled Image Display */}
                  {!isUploading && hasImage && (
                    <>
                      <img
                        src={url}
                        alt={`Portfolio sample ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      {/* Cover Photo Badge */}
                      {isCover && (
                        <div className="absolute top-2 left-2 px-2.5 py-1 bg-primary text-white text-[11px] font-bold rounded-lg shadow-md flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">photo_camera</span>
                          Cover Photo
                        </div>
                      )}
                      {/* Slot Index Badge */}
                      {!isCover && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] font-bold rounded">
                          #{index + 1}
                        </div>
                      )}
                      {/* Hover Overlay with Action Buttons */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSlotClick(index);
                          }}
                          className="p-2.5 bg-white text-gray-800 rounded-full hover:bg-gray-100 transition-colors shadow-md"
                          title="Change Photo"
                        >
                          <span className="material-symbols-outlined text-[18px]">cached</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveImage(index, e)}
                          className="p-2.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-md"
                          title="Remove Photo"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <div
        className={`fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-4 transform transition-transform duration-300 z-50 ${
          showToast ? "translate-y-0" : "translate-y-24 opacity-0 pointer-events-none"
        }`}
      >
        <span className="material-symbols-outlined text-green-400">check_circle</span>
        <p className="font-semibold">Portfolio updated successfully</p>
      </div>
      <div
        className={`fixed bottom-6 right-6 bg-red-600 text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-4 transform transition-transform duration-300 z-50 ${
          showErrorToast ? "translate-y-0" : "translate-y-24 opacity-0 pointer-events-none"
        }`}
      >
        <span className="material-symbols-outlined text-white">error</span>
        <p className="font-semibold">Failed to save portfolio changes. Please try again.</p>
      </div>
    </div>
  );
}
