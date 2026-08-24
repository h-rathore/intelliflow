import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "subtle";
  size?: "sm" | "md" | "lg" | "icon";
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "secondary",
      size = "md",
      icon,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary:
        "bg-signal hover:bg-signal-hover text-cream font-medium border border-signal active:translate-y-px",
      secondary:
        "bg-cream hover:bg-canvas-subtle text-ink border border-ink/20 hover:border-ink/40",
      outline:
        "bg-transparent hover:bg-ink/[0.04] text-ink border border-ink/25 hover:border-ink/50",
      ghost:
        "bg-transparent hover:bg-ink/[0.05] text-ink-muted hover:text-ink border border-transparent",
      subtle:
        "bg-signal-subtle hover:bg-signal/20 text-signal border border-signal/25",
      danger:
        "bg-transparent hover:bg-signal-subtle text-signal border border-signal/40",
    };

    const sizeStyles = {
      sm: "px-2.5 py-1 text-xs gap-1.5",
      md: "px-3.5 py-1.5 text-xs font-medium gap-2",
      lg: "px-4 py-2 text-sm font-medium gap-2",
      icon: "p-1.5 shrink-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-sm transition-colors duration-150 ease-studio disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
