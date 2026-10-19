"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
}

// Metro buttons: square, flat, lowercase. Outline is the classic Windows
// Phone button (thick foreground border that fills with the accent on press).
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold lowercase transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 active:translate-y-px",
          {
            "bg-primary text-primary-foreground hover:brightness-110 active:brightness-90": variant === "primary",
            "bg-muted text-foreground hover:bg-border": variant === "secondary",
            "hover:bg-muted": variant === "ghost",
            "border-2 border-foreground text-foreground active:bg-primary active:border-primary active:text-primary-foreground": variant === "outline",
            "bg-destructive text-white hover:brightness-110": variant === "destructive",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-11 px-5 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
            "h-11 w-11": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
