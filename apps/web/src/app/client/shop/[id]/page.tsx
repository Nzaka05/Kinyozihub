'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import BookingModal from '@/components/BookingModal';

interface ShopProfile {
  _id: string;
  user: {
    _id: string;
    name: string;
    profileImage: string;
    rating: number;
    reviewCount: number;
    shopName: string;
    isVerified: boolean;
  };
  shopName: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  priceRange: string;
  distanceString: string;
  nextAvailable: string;
  profileImage: string;
  portfolioImages: string[];
}

export default function ShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  // TODO: This needs to become a real Service model tied to BarberProfile/Shop before production.
  // Hardcoded for now to unblock the booking flow.
  const services = [
    { id: 'srv_1', name: 'Signature Fade', price: 1500, duration: '45 min' },
    { id: 'srv_2', name: 'Beard Trim', price: 800, duration: '30 min' },
    { id: 'srv_3', name: 'Classic Cut', price: 1200, duration: '40 min' },
    { id: 'srv_4', name: 'Hair Dye', price: 2500, duration: '60 min' },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/barbers/${params.id}`);
        if (response.data.success) {
          setProfile(response.data.data);
        } else {
          setError(response.data.message);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) {
      fetchProfile();
    }
  }, [params.id]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading shop...</div>;
  }

  if (error || !profile) {
    return <div className="p-8 text-center text-red-600">Error loading shop: {error || 'Not found'}</div>;
  }

  const handleBook = (service: any) => {
    setSelectedService(service);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-gray-50">
      {/* Top AppBar */}
      <header className="w-full top-0 sticky z-50 bg-white/95 backdrop-blur-md flex justify-between items-center px-4 py-4 border-b border-border shadow-sm">
        <div className="flex items-center gap-4">
          <span onClick={() => router.back()} className="material-symbols-outlined text-primary cursor-pointer active:scale-95 transition-transform">arrow_back</span>
          <h1 className="text-xl font-bold text-gray-900 truncate max-w-[200px]">{profile.shopName || profile.user?.shopName}</h1>
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative h-64 w-full bg-gray-200">
        <img 
          className="w-full h-full object-cover" 
          alt={profile.shopName} 
          src={profile.profileImage || profile.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.shopName || profile.user?.shopName || 'Shop')}&background=random`}
          onError={(e) => {
            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.shopName || profile.user?.shopName || 'Shop')}&background=random`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{profile.shopName || profile.user?.shopName}</h1>
              {(profile.isVerified || profile.user?.isVerified) && (
                <span className="material-symbols-outlined text-blue-400 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm opacity-90">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-yellow-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="font-semibold">{profile.rating || profile.user?.rating || 0}</span>
                <span>({profile.reviewCount || profile.user?.reviewCount || 0} reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Services</h2>
        <div className="flex flex-col gap-3">
          {services.map(service => (
            <div key={service.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">{service.name}</h3>
                <p className="text-sm text-gray-500">{service.duration}</p>
                <p className="text-primary font-bold mt-1">KES {service.price}</p>
              </div>
              <button 
                onClick={() => handleBook(service)}
                className="bg-primary text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors active:scale-95"
              >
                Book
              </button>
            </div>
          ))}
        </div>
      </div>

      {isBookingModalOpen && selectedService && (
        <BookingModal 
          isOpen={isBookingModalOpen} 
          onClose={() => setIsBookingModalOpen(false)}
          service={selectedService}
          barberId={profile.user?._id || profile._id}
          shopName={profile.shopName || profile.user?.shopName}
        />
      )}
    </div>
  );
}
