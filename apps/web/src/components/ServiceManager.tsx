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
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const presetDurations = ['15 min', '30 min', '45 min', '60 min', '90 min'];

  const openAddModal = () => {
    setEditingService(null);
    setName('');
    setPrice('');
    setDuration('45 min');
    setIsCustomDuration(false);
    setCustomMinutes('');
    setIsActive(true);
    setShowDeleteConfirm(false);
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service, openDeleteConfirm = false) => {
    setEditingService(service);
    setName(service.name);
    setPrice(service.price.toString());
    const isPreset = presetDurations.includes(service.duration);
    if (isPreset) {
      setDuration(service.duration);
      setIsCustomDuration(false);
      setCustomMinutes('');
    } else {
      setDuration(service.duration);
      setIsCustomDuration(true);
      setCustomMinutes(service.duration.replace(/\D/g, ''));
    }
    setIsActive(service.isActive);
    setShowDeleteConfirm(openDeleteConfirm);
    setIsModalOpen(true);
  };

  const handleSelectDuration = (val: string) => {
    if (val === 'Custom') {
      setIsCustomDuration(true);
      if (customMinutes) {
        setDuration(`${customMinutes} min`);
      }
    } else {
      setIsCustomDuration(false);
      setDuration(val);
    }
  };

  const handleCustomMinutesChange = (val: string) => {
    setCustomMinutes(val);
    if (val) {
      setDuration(`${val} min`);
    }
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
          duration,
          isActive
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
    try {
      await api.delete(`/services/${id}`);
      setIsModalOpen(false);
      setShowDeleteConfirm(false);
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
                  onClick={() => openEditModal(service, false)}
                  className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  title="Edit"
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button 
                  onClick={() => openEditModal(service, true)}
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

      {/* Add/Edit Bottom Sheet Modal */}
      {isModalOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm transition-opacity" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-[70] bg-surface rounded-t-[16px] shadow-2xl flex flex-col max-h-[85vh] transform transition-transform">
            {/* Drag Handle */}
            <div className="flex justify-center pt-xs pb-xs">
              <div className="w-10 h-1 bg-outline-variant rounded-full"></div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-container-margin pb-md pt-xs border-b border-outline-variant">
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                {editingService ? 'Edit Service' : 'Add Service'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-xs text-on-surface-variant hover:bg-surface-variant/50 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto px-container-margin py-lg space-y-lg custom-scrollbar">
              {/* Service Name */}
              <div className="space-y-xs">
                <label className="block font-label-bold text-label-bold text-on-surface">Service Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Signature Fade"
                  className="w-full h-12 px-md border border-outline-variant rounded-xl bg-surface-container-low focus:ring-2 focus:ring-brand-coral focus:border-brand-coral outline-none transition-all placeholder:text-on-surface-variant/50 font-body-md"
                />
              </div>

              {/* Price */}
              <div className="space-y-xs">
                <label className="block font-label-bold text-label-bold text-on-surface">Price</label>
                <div className="relative flex items-center h-12 bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-coral focus-within:border-brand-coral">
                  <span className="px-md font-label-bold text-on-surface-variant/70 border-r border-outline-variant select-none">KES</span>
                  <input 
                    type="number" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="1200"
                    className="w-full h-full px-md bg-transparent outline-none font-label-bold text-body-lg placeholder:text-on-surface-variant/50"
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-xs">
                <label className="block font-label-bold text-label-bold text-on-surface">Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {['15 min', '30 min', '45 min', '60 min', '90 min', 'Custom'].map((item) => {
                    const isSelected = item === 'Custom' ? isCustomDuration : (!isCustomDuration && duration === item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleSelectDuration(item)}
                        className={`duration-chip px-2 py-3 rounded-xl border border-outline-variant text-body-sm font-label-bold transition-colors ${
                          isSelected
                            ? 'bg-on-surface text-white'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
                {isCustomDuration && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      value={customMinutes}
                      onChange={(e) => handleCustomMinutesChange(e.target.value)}
                      placeholder="e.g. 75"
                      className="w-28 h-10 px-3 border border-outline-variant rounded-lg bg-surface-container-low text-sm font-label-bold outline-none focus:ring-2 focus:ring-brand-coral"
                    />
                    <span className="text-sm font-label-bold text-on-surface-variant">minutes</span>
                  </div>
                )}
              </div>

              {/* Active Status Toggle */}
              <div className="flex items-start justify-between gap-4 py-2">
                <div className="flex-1">
                  <label htmlFor="serviceActiveToggle" className="font-label-bold text-label-bold text-on-surface block mb-1">
                    Active Status
                  </label>
                  <p className="text-body-sm text-on-surface-variant leading-tight">
                    Inactive services are hidden from your profile but keep their booking history.
                  </p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer mt-1">
                  <input
                    id="serviceActiveToggle"
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-coral"></div>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                <button 
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !name || !price || !duration}
                  className="w-full bg-brand-coral text-white font-label-bold h-[52px] rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Service'}
                </button>
              </div>

              {/* Edit Mode - Delete Link & Inline Confirmation */}
              {editingService && (
                <div className="pt-1">
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full text-error font-label-bold py-3 hover:underline text-center text-sm"
                    >
                      Delete Service
                    </button>
                  ) : (
                    <div className="p-md bg-error-container/30 border border-error/20 rounded-xl space-y-2 animate-in fade-in">
                      <p className="text-body-sm text-on-error-container font-semibold">Delete this service?</p>
                      <p className="text-body-sm text-on-surface-variant">Existing bookings for it won&apos;t be affected.</p>
                      <div className="flex gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-2.5 rounded-lg border border-outline-variant bg-surface text-on-surface font-label-bold text-body-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(editingService._id)}
                          className="flex-1 py-2.5 rounded-lg bg-error text-on-error font-label-bold text-body-sm hover:opacity-90"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom spacing */}
              <div className="h-4"></div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
