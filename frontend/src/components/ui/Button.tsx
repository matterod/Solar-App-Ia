"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex font-semibold items-center justify-center transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:pointer-events-none",
          {
            // Variants
            "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-sky-500 hover:-translate-y-0.5":
              variant === "primary",
            "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm":
              variant === "secondary",
            "bg-red-500 text-white shadow-md shadow-red-500/20 hover:bg-red-400 hover:-translate-y-0.5":
              variant === "danger",
            "bg-transparent hover:bg-slate-100 text-slate-700": variant === "ghost",
            
            // Sizes
            "h-8 px-3 text-xs rounded-lg": size === "sm",
            "h-10 px-5 py-2.5 text-sm rounded-xl": size === "md",
            "h-12 px-6 text-base rounded-xl": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
