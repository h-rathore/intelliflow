import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  elevation?: "base" | "elevated" | "subtle";
  glow?: "blue" | "purple" | "emerald" | "amber" | "none" | string;
}

export function Card({
  children,
  className,
  hoverEffect = false,
  elevation = "base",
  glow = "none",
  ...props
}: CardProps) {
  const elevationStyles = {
    base: "bg-cream border-ink/15",
    elevated: "bg-canvas border-ink/20",
    subtle: "bg-canvas-subtle border-ink/10",
  };

  return (
    <div
      className={cn(
        "rounded-sm border text-ink transition-colors duration-150 ease-studio",
        elevationStyles[elevation],
        hoverEffect && "hover:border-ink/35",
        glow !== "none" && "border-l-2 border-l-signal",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 border-b border-ink/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.14em] text-ink font-display",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs text-ink-muted mt-0.5 leading-normal", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center px-4 py-2.5 border-t border-ink/10 text-xs text-ink-muted",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
