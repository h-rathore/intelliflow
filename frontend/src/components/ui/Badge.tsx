import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "error" | "info" | "neutral" | "accent" | "purple";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  dot = false,
  className,
  ...props
}: BadgeProps) {
  const variantStyles = {
    success: "bg-role-analyst/10 text-role-analyst border-role-analyst/30",
    warning: "bg-role-researcher/10 text-role-researcher border-role-researcher/30",
    error: "bg-signal/10 text-signal border-signal/30",
    info: "bg-role-planner/10 text-role-planner border-role-planner/30",
    accent: "bg-signal-subtle text-signal border-signal/30",
    purple: "bg-role-writer/10 text-role-writer border-role-writer/30",
    neutral: "bg-canvas-subtle text-ink-muted border-ink/15",
  };

  const dotColors = {
    success: "bg-role-analyst",
    warning: "bg-role-researcher",
    error: "bg-signal",
    info: "bg-role-planner",
    accent: "bg-signal",
    purple: "bg-role-writer",
    neutral: "bg-ink-muted",
  };

  const sizeStyles = {
    sm: "px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase",
    md: "px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border font-mono",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 shrink-0 rounded-none", dotColors[variant])}
        />
      )}
      {children}
    </span>
  );
}
