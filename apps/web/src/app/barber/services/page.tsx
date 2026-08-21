"use client";

import React from "react";
import ServiceManager from "@/components/ServiceManager";

export default function BarberServicesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Services Management</h1>
        <p className="text-sm text-gray-500">Configure the haircut and grooming services you offer to clients.</p>
      </div>
      <ServiceManager />
    </div>
  );
}
