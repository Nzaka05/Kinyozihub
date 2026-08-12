"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";

interface BlockTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BlockTimeModal({ isOpen, onClose, onSuccess }: BlockTimeModalProps) {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState("11:00");
  const [endTime, setEndTime] = useState("13:00");
  const [reason, setReason] = useState<"Personal" | "Lunch Break" | "Holiday" | "Other">("Personal");
  const [isRecurring, setIsRecurring] = useState(false);
  
  const [conflict, setConflict] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleBlock = async (confirmDespiteConflict = false) => {
    setLoading(true);
    try {
      const payload = {
        date,
        startTime,
        endTime,
        reason,
        isRecurring,
        recurringDayOfWeek: isRecurring ? new Date(date).getDay() : undefined,
        confirmDespiteConflict
      };

      const { data } = await api.post("/blocked-time", payload);

      if (data.conflict && !confirmDespiteConflict) {
        setConflict(data.conflictingBooking);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setConflict(null);
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Generate 7 days for the date strip
  const today = new Date();
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      dayStr: d.toLocaleDateString("en-US", { weekday: "short" }),
      dateNum: d.getDate(),
      fullDate: d.toISOString().split('T')[0]
    };
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-[70] bg-surface rounded-t-[16px] shadow-2xl flex flex-col max-h-[795px] transform transition-transform">
        <div className="flex justify-center pt-xs pb-xs">
          <div className="w-10 h-1 bg-outline-variant rounded-full"></div>
        </div>
        
        <div className="flex items-center justify-between px-container-margin pb-md pt-xs">
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Block Time</h2>
          <button className="p-xs text-on-surface-variant hover:bg-surface-variant/50 rounded-full transition-colors" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-container-margin space-y-lg pb-xl">
          {/* Date Picker */}
          <section className="space-y-sm">
            <label className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider">Select Date</label>
            <div className="flex gap-sm overflow-x-auto hide-scrollbar -mx-5 px-5 py-xs">
              {dates.map((d) => {
                const isSelected = date === d.fullDate;
                return (
                  <div
                    key={d.fullDate}
                    onClick={() => setDate(d.fullDate)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-[58px] h-[72px] rounded-xl cursor-pointer transition-all active:scale-95 ${
                      isSelected
                        ? "bg-brand-coral text-white shadow-lg shadow-brand-coral/20"
                        : "border border-outline-variant bg-surface-container-low text-on-surface-variant"
                    }`}
                  >
                    <span className={`text-[12px] ${isSelected ? "opacity-90" : ""}`}>{d.dayStr}</span>
                    <span className="text-headline-md font-bold">{d.dateNum}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Time Range Selection */}
          <section className="grid grid-cols-2 gap-md">
            <div className="space-y-sm">
              <label className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider">From</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-[52px] w-full bg-surface-container-low border border-outline-variant rounded-xl px-md font-label-bold text-body-lg focus:ring-brand-coral"
              />
            </div>
            <div className="space-y-sm">
              <label className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider">To</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-[52px] w-full bg-surface-container-low border border-outline-variant rounded-xl px-md font-label-bold text-body-lg focus:ring-brand-coral"
              />
            </div>
          </section>

          {/* Reason Chips */}
          <section className="space-y-sm">
            <label className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider">Reason</label>
            <div className="flex flex-wrap gap-xs">
              {(["Personal", "Lunch Break", "Holiday", "Other"] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`px-md py-xs rounded-full font-label-bold active:scale-95 transition-all ${
                    reason === r
                      ? "bg-brand-coral text-white shadow-md shadow-brand-coral/20"
                      : "border border-outline-variant bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </section>

          {/* Repeat Toggle */}
          <section className="bg-surface-container-low p-md rounded-xl space-y-xs">
            <div className="flex items-center justify-between">
              <label className="font-label-bold text-body-lg text-on-surface" htmlFor="repeatWeekly">Repeat weekly</label>
              <div className="relative inline-flex items-center cursor-pointer">
                <input
                  id="repeatWeekly"
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-coral"></div>
              </div>
            </div>
            {isRecurring && (
              <p className="text-body-sm text-on-surface-variant transition-all overflow-hidden mt-1">
                This time will be blocked every {new Date(date).toLocaleDateString("en-US", { weekday: "long" })} until you turn this off. 
                <br />
                <span className="text-amber-600 font-semibold text-xs flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  Conflict detection is skipped for recurring blocks.
                </span>
              </p>
            )}
          </section>

          {/* Warning Card */}
          {conflict && (
            <section className="bg-[#FFF8E1] border border-[#FFE082] p-md rounded-xl flex gap-md animate-pulse-subtle">
              <span className="material-symbols-outlined text-[#F57C00] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              <div className="space-y-xs">
                <p className="text-body-sm font-semibold text-[#5D4037]">Conflict Detected</p>
                <p className="text-body-sm text-[#5D4037] leading-tight">
                  This overlaps with a confirmed appointment ({conflict.clientName}, {conflict.time}). Blocking will not cancel it — you'll need to cancel or reschedule separately.
                </p>
              </div>
            </section>
          )}

          {/* CTA */}
          <footer className="pt-md">
            <button
              onClick={() => handleBlock(!!conflict)}
              disabled={loading}
              className={`w-full h-14 font-headline-md rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-sm ${
                success ? "bg-green-600 text-white shadow-green-600/30" : "bg-brand-coral text-white shadow-brand-coral/30"
              }`}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  <span>Blocking...</span>
                </>
              ) : success ? (
                <>
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>Blocked Successfully</span>
                </>
              ) : (
                <>
                  <span>Block This Time</span>
                  <span className="material-symbols-outlined">lock</span>
                </>
              )}
            </button>
          </footer>
        </div>
      </div>
    </>
  );
}
