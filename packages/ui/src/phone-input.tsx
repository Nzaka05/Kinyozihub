import React from "react";

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <div className={`flex bg-white border border-border rounded-button focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all overflow-hidden h-12 ${className}`}>
        <div className="px-4 bg-background border-r border-border flex items-center gap-2 text-sm font-semibold text-textPrimary">
          <span className="text-xl leading-none">🇰🇪</span>
          <span>+254</span>
        </div>
        <input
          type="tel"
          className="flex-grow bg-transparent border-none px-4 py-2 text-sm text-textPrimary outline-none placeholder:text-textPrimary/50"
          placeholder="7XX XXX XXX"
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
