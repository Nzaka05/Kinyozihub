"use client";

import React from "react";

export interface RoleCardProps {
  value: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  name: string;
  selected?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function RoleCard({ value, title, description, icon, name, selected, onChange }: RoleCardProps) {
  return (
    <label 
      className={`relative flex p-4 rounded-card border cursor-pointer hover:shadow-md transition-all duration-200 active:scale-[0.98] ${
        selected 
          ? "border-primary bg-primary/5" 
          : "border-border bg-white"
      }`}
    >
      <input 
        type="radio" 
        name={name} 
        value={value} 
        className="peer sr-only" 
        checked={selected}
        onChange={onChange}
      />
      <div className="flex items-start gap-4 w-full">
        <div className="bg-background rounded-full p-3 flex-shrink-0 flex items-center justify-center">
          <div className={`flex items-center justify-center ${
            selected ? "text-primary" : "text-textPrimary"
          }`}>
            {icon}
          </div>
        </div>
        <div className="flex-grow pt-1">
          <h2 className="text-xl font-semibold text-textPrimary mb-1">{title}</h2>
          <p className="text-sm text-textPrimary/80 leading-relaxed">{description}</p>
        </div>
        <div className={`absolute top-4 right-4 text-primary transition-opacity ${
          selected ? "opacity-100" : "opacity-0"
        }`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
          </svg>
        </div>
      </div>
    </label>
  );
}
