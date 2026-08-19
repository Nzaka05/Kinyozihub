'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ClientDrawer from '@/components/ClientDrawer';
import FilterPanel, { FilterState } from '@/components/FilterPanel';

interface Barber {
  _id: string;
  user?: {
    _id: string;
    name?: string;
    phone?: string;
    role?: string;
    profileImage?: string;
  };
  shopName: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  priceRange: string;
  distanceString: string;
  nextAvailable: string;
  profileImage: string;
  isSponsored: boolean;
  specialties?: string[];
}

export default function DiscoverPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, isLoading: authLoading } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    rating: null,
    priceMin: 500,
    priceMax: 3000,
    specialties: [],
    availableToday: false
  });

  useEffect(() => {
    if (authLoading) return;

    const fetchBarbers = async () => {
      try {
        const response = await api.get('/barbers');
        if (response.data.success) {
          setBarbers(response.data.data);
        } else {
          setError(response.data.message);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBarbers();
  }, [authLoading]);

  // Client-side filtering
  const filteredBarbers = barbers.filter(barber => {
    // Rating
    if (filters.rating !== null && barber.rating < filters.rating) return false;

    // Price
    const priceMatches = barber.priceRange.match(/\d+/g);
    if (priceMatches && priceMatches.length >= 2) {
      const minPrice = parseInt(priceMatches[0]);
      const maxPrice = parseInt(priceMatches[1]);
      // If barber's max is less than filter min, or barber's min is greater than filter max
      if (maxPrice < filters.priceMin || minPrice > filters.priceMax) return false;
    }

    // Specialties
    if (filters.specialties.length > 0) {
      if (!barber.specialties || !filters.specialties.some(s => barber.specialties!.includes(s))) {
        return false;
      }
    }

    // Available today
    if (filters.availableToday) {
      if (!barber.nextAvailable.toLowerCase().includes('today') && !barber.nextAvailable.toLowerCase().includes('now')) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Top AppBar */}
      <header className="w-full top-0 sticky z-50 bg-white/95 backdrop-blur-md flex justify-between items-center px-4 py-4 transition-opacity duration-150 border-b border-border shadow-sm">
        <div className="flex items-center gap-4">
          <span onClick={() => setIsDrawerOpen(true)} className="material-symbols-outlined text-primary cursor-pointer active:scale-95 transition-transform">menu</span>
          <h1 className="text-2xl font-bold text-primary">KinyoziHub</h1>
        </div>
        <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer active:scale-95 transition-transform border-2 border-primary/20">
          <img 
            className="w-full h-full object-cover" 
            alt="User profile" 
            src="https://ui-avatars.com/api/?name=User&background=random" 
          />
        </div>
      </header>

      {/* Search Section */}
      <section className="px-4 mt-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-gray-400">search</span>
          </div>
          <input 
            className="w-full h-12 bg-white border border-gray-200 rounded-xl pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm" 
            placeholder="Search area (e.g. Westlands)" 
            type="text"
          />
        </div>
      </section>

      {/* Filter Chips */}
      <section className="mt-4 overflow-x-auto no-scrollbar flex gap-2 px-4 whitespace-nowrap">
        <button onClick={() => setIsFilterPanelOpen(true)} className="flex items-center gap-1 px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-semibold active:scale-95 text-gray-700">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          Rating
        </button>
        <button onClick={() => setIsFilterPanelOpen(true)} className="flex items-center gap-1 px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-semibold active:scale-95 text-gray-700">
          <span className="material-symbols-outlined text-sm">payments</span>
          Price range
        </button>
        <button onClick={() => setIsFilterPanelOpen(true)} className="flex items-center gap-1 px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-semibold active:scale-95 text-gray-700">
          <span className="material-symbols-outlined text-sm">content_cut</span>
          Specialty
        </button>
        <button onClick={() => setIsFilterPanelOpen(true)} className="flex items-center gap-1 px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-semibold active:scale-95 text-gray-700">
          <span className="material-symbols-outlined text-sm">event_available</span>
          Available today
        </button>
      </section>

      {/* Context Header */}
      <section className="px-4 mt-6">
        <h2 className="text-xl font-semibold text-gray-900">Showing barbers near Westlands, Nairobi</h2>
      </section>

      {/* Barber List */}
      <section className="px-4 mt-4 flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center p-8 text-gray-500">Loading barbers...</div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
        ) : filteredBarbers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No barbers found matching your criteria.</div>
        ) : (
          filteredBarbers.map((barber) => (
            <Link key={barber._id} href={`/client/shop/${barber.user?._id || barber._id}`} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm flex flex-col group cursor-pointer active:scale-[0.98] transition-transform">
              <div className="relative h-48 w-full">
                <img 
                  className="w-full h-full object-cover" 
                  alt={barber.shopName} 
                  src={barber.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(barber.shopName)}&background=random`}
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(barber.shopName)}&background=random`;
                  }}
                />
                {barber.isSponsored && (
                  <div className="absolute top-3 right-3 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Sponsored
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1">
                    <h3 className="text-lg font-semibold text-gray-900">{barber.shopName}</h3>
                    {barber.isVerified && (
                      <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-semibold text-sm">{barber.rating}</span>
                    <span className="text-sm text-gray-500">({barber.reviewCount})</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">{barber.priceRange}</p>
                    <p className="text-sm text-gray-600">{barber.distanceString}</p>
                  </div>
                  <div className="flex items-center gap-1 text-primary mt-1">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <p className="text-sm font-semibold">Next: {barber.nextAvailable}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </section>

      <ClientDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <FilterPanel 
        isOpen={isFilterPanelOpen} 
        onClose={() => setIsFilterPanelOpen(false)} 
        onApply={setFilters} 
        initialFilters={filters} 
      />
    </div>
  );
}
