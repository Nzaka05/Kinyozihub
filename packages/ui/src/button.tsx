import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    
    let variantClass = "bg-primary text-white hover:opacity-90";
    if (variant === "secondary") variantClass = "bg-secondary text-white hover:opacity-90";
    if (variant === "outline") variantClass = "border border-border bg-transparent hover:bg-border/50 text-textPrimary";
    if (variant === "ghost") variantClass = "hover:bg-border/50 text-textPrimary";
    if (variant === "link") variantClass = "text-primary underline-offset-4 hover:underline";

    let sizeClass = "h-12 px-4 py-2";
    if (size === "sm") sizeClass = "h-9 px-3 text-xs";
    if (size === "lg") sizeClass = "h-14 px-8 text-base";
    if (size === "icon") sizeClass = "h-12 w-12";

    const baseClass = "inline-flex items-center justify-center whitespace-nowrap rounded-button text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    return (
      <button
        className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
