'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@kinyozihub/ui';
import { useAuth } from '@/contexts/AuthContext';

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const { isLoading: authLoading } = useAuth();
  
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && params.id) {
      fetchBooking();
    }
  }, [authLoading, params.id]);

  const fetchBooking = async () => {
    try {
      const res = await api.get('/bookings');
      if (res.data?.success) {
        const found = res.data.data.find((b: any) => b._id === params.id);
        if (found) {
          setBooking(found);
        } else {
          setError('Booking not found');
        }
      }
    } catch (err: any) {
      setError('Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-border">
          <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{error || 'Booking not found'}</h2>
          <Button onClick={() => router.push('/client/bookings')} className="mt-4 rounded-xl">Back to Bookings</Button>
        </div>
      </div>
    );
  }

  if (booking.status !== 'completed' || booking.reviewLeft) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-border">
          <span className="material-symbols-outlined text-4xl text-orange-500 mb-2">info</span>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {booking.reviewLeft ? 'Review Already Submitted' : 'Ineligible for Review'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {booking.reviewLeft 
              ? 'You have already left a review for this booking.' 
              : 'You can only review completed bookings.'}
          </p>
          <Button onClick={() => router.push('/client/bookings')} className="mt-4 rounded-xl w-full">Back to Bookings</Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/reviews', {
        bookingId: booking._id,
        rating,
        comment
      });

      if (res.data?.success) {
        router.push('/client/bookings');
      } else {
        setError(res.data?.message || 'Failed to submit review');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white w-full top-0 sticky z-50 border-b border-border shadow-sm">
        <div className="flex justify-between items-center px-4 py-4">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-primary active:scale-95">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <h1 className="text-xl font-semibold text-textPrimary absolute left-1/2 -translate-x-1/2">
            Leave a Review
          </h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-5 py-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border mb-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-full overflow-hidden mb-3 bg-gray-200">
              {booking.barber.profileImage ? (
                <img src={booking.barber.profileImage} alt={booking.barber.name} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-4xl text-gray-400 mt-4">person</span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{booking.barber.name}</h2>
            <p className="text-gray-500 text-sm">{booking.serviceName}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <label className="text-sm font-semibold text-gray-700">How was your service?</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform active:scale-90"
                  >
                    <span 
                      className={`material-symbols-outlined text-4xl ${rating >= star ? 'text-yellow-400' : 'text-gray-200'}`}
                      style={{ fontVariationSettings: rating >= star ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      star
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="comment" className="text-sm font-semibold text-gray-700">Add a comment (optional)</label>
              <textarea
                id="comment"
                rows={4}
                maxLength={500}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
              <span className="text-xs text-gray-400 text-right">{comment.length}/500</span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full rounded-xl py-6 mt-2" 
              disabled={submitting || rating === 0}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
