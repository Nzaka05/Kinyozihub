"use client";

import React, { useRef, useState, KeyboardEvent } from "react";

export interface OtpInputProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function OtpInput({ length = 4, value = "", onChange, className = "" }: OtpInputProps) {
  const [internalValue, setInternalValue] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    if (value) {
      setInternalValue(value.padEnd(length, "").split("").slice(0, length));
    }
  }, [value, length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/\D/g, ""); 
    if (!val) return;

    const newValue = [...internalValue];
    newValue[index] = val.slice(-1); 
    
    setInternalValue(newValue);
    if (onChange) {
      onChange(newValue.join(""));
    }

    if (index < length - 1 && val) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!internalValue[index] && index > 0) {
        const newValue = [...internalValue];
        newValue[index - 1] = "";
        setInternalValue(newValue);
        if (onChange) {
          onChange(newValue.join(""));
        }
        inputRefs.current[index - 1]?.focus();
      } else {
        const newValue = [...internalValue];
        newValue[index] = "";
        setInternalValue(newValue);
        if (onChange) {
          onChange(newValue.join(""));
        }
      }
    }
  };

  return (
    <div className={`flex justify-between gap-4 w-full max-w-[320px] mx-auto ${className}`}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="number"
          pattern="\d*"
          maxLength={1}
          value={internalValue[index]}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="w-full aspect-square text-center text-3xl font-semibold text-textPrimary bg-white border border-border rounded-card focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-colors shadow-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
