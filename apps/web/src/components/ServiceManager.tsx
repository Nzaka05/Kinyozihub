"use client";

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Service {
  _id: string;
  name: string;
  price: number;
  duration: string;
  isActive: boolean;
}

export default function ServiceManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('45 min');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get('/services/mine');
      if (res.data.success) {
        setServices(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load services", err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingService(null);
    setName('');
    setPrice('');
    setDuration('45 min');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setPrice(service.price.toString());
    setDuration(service.duration);
    setIsActive(service.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name || !price || !duration) return;
    setIsSaving(true);
    try {
      if (editingService) {
        await api.patch(`/services/${editingService._id}`, {
          name,
          price: Number(price),
          duration,
          isActive
        });
      } else {
        await api.post('/services', {
          name,
          price: Number(price),
          duration
        });
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (err) {
      console.error("Failed to save service", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.delete(`/services/${id}`);
      fetchServices();
    } catch (err) {
      console.error("Failed to delete service", err);
    }
  };

  return (
    <section className="bg-white border border-border rounded-xl shadow-sm p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">content_cut</span>
          <h3 className="text-xl font-semibold">Services Offered</h3>
        </div>
        <button 
          onClick={openAddModal}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          Add Service
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4 text-gray-500">Loading services...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          No services added yet. Add some services for clients to book.
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(service => (
            <div key={service._id} className={`flex items-center justify-between p-4 border rounded-xl ${!service.isActive ? 'bg-gray-50 opacity-75' : 'bg-white border-gray-200'}`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{service.name}</h4>
                  {!service.isActive && (
                    <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full font-medium">Inactive</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="text-primary font-semibold">KES {service.price}</span>
                  <span>•</span>
                  <span>{service.duration}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => openEditModal(service)}
                  className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  title="Edit"
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button 
                  onClick={() => handleDelete(service._id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingService ? 'Edit Service' : 'Add Service'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Service Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Signature Fade"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50" 
                />
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-sm font-semibold text-gray-700">Price (KES)</label>
                  <input 
                    type="number" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50" 
                  />
                </div>
                
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-sm font-semibold text-gray-700">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50 appearance-none"
                  >
                    <option value="15 min">15 min</option>
                    <option value="30 min">30 min</option>
                    <option value="45 min">45 min</option>
                    <option value="60 min">60 min</option>
                    <option value="90 min">90 min</option>
                    <option value="120 min">120 min</option>
                  </select>
                </div>
              </div>

              {editingService && (
                <div className="flex items-center gap-3 pt-2">
                  <input 
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary" 
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Service is active and bookable
                  </label>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50/50">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving || !name || !price || !duration}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
