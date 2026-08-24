"use client";

import React from "react";
import { AgentRole, AgentState } from "@/types/workforce";
import { cn } from "@/lib/utils";

interface AgentCharacterProps {
  role: AgentRole;
  state: AgentState;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showNameplate?: boolean;
}

export function AgentCharacter({
  role,
  state,
  size = "md",
  className,
  showNameplate = false,
}: AgentCharacterProps) {
  const isThinking = state === "thinking";
  const isWorking = state === "working";
  const isCompleted = state === "completed";
  const isWaiting = state === "waiting" || state === "idle";
  const isFailed = state === "failed";

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-18 h-18",
    xl: "w-24 h-24",
  };

  // Role Color Palettes (Restrained, Professional)
  const roleThemes: Record<AgentRole, { primary: string; secondary: string; tint: string }> = {
    planner: {
      primary: "#3B82F6", // Cobalt Blueprint
      secondary: "#1D4ED8",
      tint: "rgba(59, 130, 246, 0.15)",
    },
    researcher: {
      primary: "#F59E0B", // Amber Radar
      secondary: "#D97706",
      tint: "rgba(245, 158, 11, 0.15)",
    },
    analyst: {
      primary: "#10B981", // Emerald Matrix
      secondary: "#059669",
      tint: "rgba(16, 185, 129, 0.15)",
    },
    writer: {
      primary: "#8B5CF6", // Violet Stylus
      secondary: "#7C3AED",
      tint: "rgba(139, 92, 246, 0.15)",
    },
    reviewer: {
      primary: "#EC4899", // Rose Loupe
      secondary: "#DB2777",
      tint: "rgba(236, 72, 153, 0.15)",
    },
  };

  const theme = roleThemes[role];

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center select-none shrink-0 transition-all duration-300",
        sizeClasses[size],
        isThinking && "animate-[bounce_3s_ease-in-out_infinite] motion-reduce:animate-none",
        isWaiting && "opacity-45 grayscale-[0.6]",
        isFailed && "opacity-80",
        className
      )}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id={`chassis-${role}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1B1E28" />
            <stop offset="100%" stopColor="#101219" />
          </linearGradient>

          <linearGradient id={`accent-${role}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.primary} />
            <stop offset="100%" stopColor={theme.secondary} />
          </linearGradient>

          {/* Micro scan pattern */}
          <pattern id={`scan-${role}`} width="4" height="4" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="4" y2="0" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Outer Orbit Halo (State-Responsive) */}
        {isWorking && (
          <circle
            cx="32"
            cy="32"
            r="29"
            stroke={theme.primary}
            strokeWidth="1.25"
            strokeDasharray="4 3"
            className="animate-[spin_6s_linear_infinite] motion-reduce:animate-none opacity-70"
          />
        )}

        {isThinking && (
          <circle
            cx="32"
            cy="32"
            r="29"
            stroke={theme.primary}
            strokeWidth="1.25"
            className="animate-ping motion-reduce:animate-none opacity-40"
          />
        )}

        {isCompleted && (
          <circle
            cx="32"
            cy="32"
            r="29"
            stroke="#10B981"
            strokeWidth="1.25"
            className="opacity-75"
          />
        )}

        {/* Chassis Body Shield (Unified Workforce Silhouette) */}
        <polygon
          points="32,5 53,16 53,48 32,59 11,48 11,16"
          fill={`url(#chassis-${role})`}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.5"
        />

        {/* Sub-plate */}
        <polygon
          points="32,9 49,18 49,46 32,55 15,46 15,18"
          fill="#13151D"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />

        {/* Scanline overlay */}
        <polygon
          points="32,9 49,18 49,46 32,55 15,46 15,18"
          fill={`url(#scan-${role})`}
        />

        {/* ── Role Character Features ── */}

        {/* 1. PLANNER: Hex Visor & Routing Nodes */}
        {role === "planner" && (
          <g>
            <line x1="32" y1="5" x2="32" y2="13" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" />
            <circle cx="32" cy="5" r="2.5" fill={isWorking || isThinking ? theme.primary : "#4B5563"} />

            <rect x="21" y="22" width="22" height="14" rx="2.5" fill="#0A0C13" stroke={theme.primary} strokeWidth="1.2" />
            <line x1="26" y1="22" x2="26" y2="36" stroke="rgba(59,130,246,0.3)" strokeWidth="1" />
            <line x1="32" y1="22" x2="32" y2="36" stroke="rgba(59,130,246,0.3)" strokeWidth="1" />
            <line x1="38" y1="22" x2="38" y2="36" stroke="rgba(59,130,246,0.3)" strokeWidth="1" />
            <line x1="21" y1="29" x2="43" y2="29" stroke="rgba(59,130,246,0.3)" strokeWidth="1" />

            <circle
              cx={isWorking ? "32" : "26"}
              cy="29"
              r="2"
              fill={theme.primary}
              className={isWorking || isThinking ? "animate-pulse" : ""}
            />

            <polyline points="26,44 32,48 38,44" stroke={theme.primary} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </g>
        )}

        {/* 2. RESEARCHER: Radar Sweeper & Multi-Spectrum Scanner */}
        {role === "researcher" && (
          <g>
            <line x1="16" y1="12" x2="24" y2="18" stroke={theme.primary} strokeWidth="1.5" />
            <line x1="48" y1="12" x2="40" y2="18" stroke={theme.primary} strokeWidth="1.5" />

            <circle cx="32" cy="28" r="10" fill="#0A0C13" stroke={theme.primary} strokeWidth="1.2" />
            <circle cx="32" cy="28" r="6" stroke="rgba(245,158,11,0.3)" strokeWidth="1" />
            <circle cx="32" cy="28" r="2" fill={theme.primary} />

            {/* Radar Scan Ray */}
            {(isWorking || isThinking) && (
              <line
                x1="32"
                y1="28"
                x2="40"
                y2="22"
                stroke={theme.primary}
                strokeWidth="1.5"
                strokeLinecap="round"
                className="animate-[spin_3s_linear_infinite] origin-[32px_28px] motion-reduce:animate-none"
              />
            )}

            <path
              d="M22,46 Q27,42 32,46 T42,46"
              fill="none"
              stroke={theme.primary}
              strokeWidth="1.2"
              className={isWorking || isThinking ? "animate-pulse" : ""}
            />
          </g>
        )}

        {/* 3. ANALYST: Matrix Prism Eyes & Bar Calculation Graph */}
        {role === "analyst" && (
          <g>
            <polygon points="32,10 36,15 28,15" fill={theme.primary} />

            <rect x="18" y="23" width="11" height="11" rx="2" fill="#0A0C13" stroke={theme.primary} strokeWidth="1.2" />
            <rect x="35" y="23" width="11" height="11" rx="2" fill="#0A0C13" stroke={theme.primary} strokeWidth="1.2" />

            <rect
              x="21"
              y="26"
              width="5"
              height="5"
              fill={theme.primary}
              className={isWorking || isThinking ? "animate-ping opacity-75" : ""}
            />
            <rect
              x="38"
              y="26"
              width="5"
              height="5"
              fill={theme.primary}
              className={isWorking || isThinking ? "animate-ping opacity-75" : ""}
            />

            <line x1="22" y1="46" x2="22" y2="42" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" />
            <line x1="27" y1="46" x2="27" y2="39" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" />
            <line x1="32" y1="46" x2="32" y2="44" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" />
            <line x1="37" y1="46" x2="37" y2="40" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" />
            <line x1="42" y1="46" x2="42" y2="38" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* 4. WRITER: Stylus Emitter & Document Buffer Ribbon */}
        {role === "writer" && (
          <g>
            <polygon points="32,8 35,16 29,16" fill={theme.primary} />

            <rect x="18" y="22" width="28" height="12" rx="2" fill="#0A0C13" stroke={theme.primary} strokeWidth="1.2" />
            <line x1="22" y1="26" x2="42" y2="26" stroke={theme.primary} strokeWidth="1.2" strokeLinecap="round" />
            <line
              x1="22"
              y1="30"
              x2={isWorking || isThinking ? "34" : "38"}
              y2="30"
              stroke={theme.primary}
              strokeWidth="1.2"
              strokeLinecap="round"
              className={isWorking || isThinking ? "animate-pulse" : ""}
            />

            <polygon points="32,44 36,49 28,49" fill={theme.primary} />
            <circle cx="32" cy="53" r="1.5" fill={isWorking || isThinking ? theme.primary : "#4B5563"} />
          </g>
        )}

        {/* 5. REVIEWER: Precision Reticle Monocle & Verification Lattice */}
        {role === "reviewer" && (
          <g>
            <path d="M22,12 Q32,16 42,12" stroke={theme.primary} strokeWidth="1.5" strokeLinecap="round" fill="none" />

            <circle cx="32" cy="28" r="9" fill="#0A0C13" stroke={theme.primary} strokeWidth="1.5" />
            <circle cx="32" cy="28" r="4" stroke="rgba(236,72,153,0.4)" strokeWidth="1" strokeDasharray="2 2" />

            <line x1="32" y1="19" x2="32" y2="23" stroke={theme.primary} strokeWidth="1.5" />
            <line x1="32" y1="33" x2="32" y2="37" stroke={theme.primary} strokeWidth="1.5" />
            <line x1="23" y1="28" x2="27" y2="28" stroke={theme.primary} strokeWidth="1.5" />
            <line x1="37" y1="28" x2="41" y2="28" stroke={theme.primary} strokeWidth="1.5" />

            <path d="M28,44 L32,48 L36,44" stroke={theme.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
        )}

        {/* ── Status Seal ── */}
        {isCompleted && (
          <g transform="translate(42, 5)">
            <circle cx="6" cy="6" r="6.5" fill="#10B981" />
            <polyline points="3.5,6 5.5,8 8.5,4" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
        )}

        {(isWorking || isThinking) && (
          <g transform="translate(42, 5)">
            <circle cx="6" cy="6" r="6" fill={theme.primary} className="animate-ping opacity-60" />
            <circle cx="6" cy="6" r="4" fill={theme.primary} />
          </g>
        )}

        {isFailed && (
          <g transform="translate(42, 5)">
            <circle cx="6" cy="6" r="6.5" fill="#EF4444" />
            <line x1="6" y1="3.5" x2="6" y2="6.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="6" cy="8.5" r="0.8" fill="#FFFFFF" />
          </g>
        )}
      </svg>

      {showNameplate && (
        <span className="text-[10px] font-mono text-slate-400 capitalize mt-1 tracking-tight">
          {role}
        </span>
      )}
    </div>
  );
}
