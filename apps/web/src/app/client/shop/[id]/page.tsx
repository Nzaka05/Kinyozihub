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
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndServices = async () => {
      try {
        const [profileRes, servicesRes, reviewsRes] = await Promise.all([
          api.get(`/barbers/${params.id}`),
          api.get(`/barbers/${params.id}/services`),
          api.get(`/barbers/${params.id}/reviews?limit=5`)
        ]);

        if (profileRes.data.success) {
          setProfile(profileRes.data.data);
        } else {
          setError(profileRes.data.message);
        }

        if (servicesRes.data.success) {
          setServices(servicesRes.data.data);
        }
        
        if (reviewsRes.data?.success) {
          setReviews(reviewsRes.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
        setReviewsLoading(false);
      }
    };
    if (params.id) {
      fetchProfileAndServices();
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
        {services.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center">
            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2 block">content_cut</span>
            <p className="text-gray-500 font-medium">No services available yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {services.map(service => (
              <div key={service._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
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
        )}
      </div>

      {/* Reviews Section */}
      <div className="p-4 mt-2 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Reviews ({profile.reviewCount || profile.user?.reviewCount || 0})</h2>
        </div>
        {reviewsLoading ? (
          <div className="text-center py-4 text-gray-500">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2 block">star</span>
            <p className="text-gray-500 font-medium">No reviews yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map(review => (
              <div key={review._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {review.client?.profileImage ? (
                        <img src={review.client.profileImage} alt={review.client.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                          {review.client?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{review.client?.name || 'User'}</p>
                      <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg">
                    <span className="material-symbols-outlined text-yellow-500 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-bold text-xs ml-1 text-yellow-700">{review.rating}</span>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
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
