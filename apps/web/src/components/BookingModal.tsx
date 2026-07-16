'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: { id: string; name: string; price: number; duration: string };
  barberId: string;
  shopName: string;
}

export default function BookingModal({ isOpen, onClose, service, barberId, shopName }: BookingModalProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Simple date generator for next 7 days
  const nextDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateString: d.toISOString().split('T')[0],
      display: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    };
  });

  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
  ];

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select a date and time');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      const response = await api.post('/bookings', {
        barberId,
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        date: selectedDate,
        timeSlot: selectedTime
      });

      if (response.data.success) {
        // Redirect to bookings list
        router.push('/client/bookings');
      } else {
        setError(response.data.error || 'Failed to book appointment');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm">
      <div 
        className="w-full sm:w-[400px] bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-4 duration-300"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Book Appointment</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-gray-600 text-sm">close</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Booking with</p>
          <p className="font-semibold text-gray-900 mb-3">{shopName}</p>
          
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-900">{service.name}</p>
              <p className="text-sm text-gray-500">{service.duration}</p>
            </div>
            <p className="font-bold text-primary">KES {service.price}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Select Date</h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {nextDays.map(day => (
              <button
                key={day.dateString}
                onClick={() => setSelectedDate(day.dateString)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors active:scale-95 ${
                  selectedDate === day.dateString 
                    ? 'bg-primary text-white border border-primary' 
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {day.display}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Select Time</h3>
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.map(time => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`py-2 rounded-xl text-sm font-semibold transition-colors active:scale-95 ${
                  selectedTime === time 
                    ? 'bg-primary text-white border border-primary' 
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selectedDate || !selectedTime || isSubmitting}
          className="w-full bg-primary text-white py-3 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2"
        >
          {isSubmitting ? (
            <span className="material-symbols-outlined animate-spin">refresh</span>
          ) : (
            'Confirm Booking'
          )}
        </button>
      </div>
    </div>
  );
}
