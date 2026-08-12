'use client';

import React, { useState, useEffect } from 'react';

export interface FilterState {
  rating: number | null;
  priceMin: number;
  priceMax: number;
  specialties: string[];
  availableToday: boolean;
}

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters: FilterState;
}

export default function FilterPanel({ isOpen, onClose, onApply, initialFilters }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  useEffect(() => {
    if (isOpen) setFilters(initialFilters);
  }, [isOpen, initialFilters]);

  if (!isOpen) return null;

  const handleRatingToggle = (val: number | null) => {
    setFilters(prev => ({ ...prev, rating: prev.rating === val ? null : val }));
  };

  const handleSpecialtyToggle = (spec: string) => {
    setFilters(prev => ({
      ...prev,
      specialties: prev.specialties.includes(spec) 
        ? prev.specialties.filter(s => s !== spec)
        : [...prev.specialties, spec]
    }));
  };

  const handleClear = () => {
    setFilters({
      rating: null,
      priceMin: 500,
      priceMax: 3000,
      specialties: [],
      availableToday: false
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[100] transition-opacity" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[101] flex flex-col bg-white rounded-t-3xl max-h-[90vh] shadow-xl animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <button onClick={handleClear} className="text-sm font-semibold text-gray-500">Reset</button>
          <h2 className="text-lg font-bold">Filters</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-500"><span className="material-symbols-outlined">close</span></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          {/* Rating */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-gray-900">Rating</h3>
            <div className="flex flex-wrap gap-2">
              {[4.5, 4.0, 3.5].map(r => (
                <button
                  key={r}
                  onClick={() => handleRatingToggle(r)}
                  className={`px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${filters.rating === r ? 'bg-primary border-primary text-white' : 'border-gray-200 text-gray-700 bg-white'}`}
                >
                  <span className="material-symbols-outlined text-sm align-middle mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  {r}+
                </button>
              ))}
              <button
                onClick={() => handleRatingToggle(null)}
                className={`px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${filters.rating === null ? 'bg-primary border-primary text-white' : 'border-gray-200 text-gray-700 bg-white'}`}
              >
                Any
              </button>
            </div>
          </div>

          {/* Price Range */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Price Range</h3>
              <span className="text-sm font-semibold text-primary">
                KES {filters.priceMin} - KES {filters.priceMax}
              </span>
            </div>
            
            <div className="relative pt-4 pb-2">
              <div className="flex justify-between items-center gap-4">
                <input 
                  type="number" 
                  value={filters.priceMin} 
                  onChange={(e) => setFilters(p => ({...p, priceMin: Math.min(Number(e.target.value), p.priceMax)}))}
                  className="w-24 p-2 border border-gray-200 rounded text-sm text-center"
                  min={0}
                />
                <span className="text-gray-400">to</span>
                <input 
                  type="number" 
                  value={filters.priceMax} 
                  onChange={(e) => setFilters(p => ({...p, priceMax: Math.max(Number(e.target.value), p.priceMin)}))}
                  className="w-24 p-2 border border-gray-200 rounded text-sm text-center"
                  min={0}
                />
              </div>
            </div>
          </div>

          {/* Specialty */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-gray-900">Specialty</h3>
            <div className="flex flex-wrap gap-2">
              {['Fades', 'Dreadlocks', 'Kids Cuts', 'Beard Sculpting', 'Braids', 'Classic Cuts'].map(spec => (
                <button
                  key={spec}
                  onClick={() => handleSpecialtyToggle(spec)}
                  className={`px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${filters.specialties.includes(spec) ? 'bg-primary border-primary text-white' : 'border-gray-200 text-gray-700 bg-white'}`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Available today */}
          <div className="flex justify-between items-center pt-2">
            <div className="flex flex-col">
              <h3 className="font-semibold text-gray-900">Available today only</h3>
              <p className="text-xs text-gray-500">Show barbers with open slots today</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={filters.availableToday} onChange={(e) => setFilters(p => ({...p, availableToday: e.target.checked}))} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-4">
          <button onClick={handleClear} className="px-6 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 active:scale-95 transition-transform">Clear All</button>
          <button 
            onClick={() => { onApply(filters); onClose(); }} 
            className="flex-1 bg-primary text-white rounded-xl py-3 font-semibold active:scale-95 transition-transform"
          >
            Show Results
          </button>
        </div>
      </div>
    </>
  );
}
