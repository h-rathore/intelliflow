"use client";

import React, { useRef, useEffect } from "react";
import { ActivityEvent, AgentRole } from "@/types/workforce";
import { TerminalIcon, ClockIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

interface ActivityFeedProps {
  events: ActivityEvent[];
  className?: string;
  maxHeight?: string;
}

export function ActivityFeed({
  events,
  className,
  maxHeight = "h-56",
}: ActivityFeedProps) {
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  const roleTagColors: Record<AgentRole, string> = {
    planner: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    researcher: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    analyst: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    writer: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    reviewer: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.08] bg-[#0E1017] flex flex-col min-h-0 overflow-hidden",
        className
      )}
    >
      {/* Feed Header */}
      <div className="px-3.5 py-2.5 border-b border-white/[0.06] flex items-center justify-between bg-[#12141C]">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-semibold text-slate-200">
            Workforce Activity Stream
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Logs ({events.length})</span>
        </div>
      </div>

      {/* Log Feed Items */}
      <div
        className={cn(
          "flex-1 overflow-y-auto p-3 space-y-1.5 font-mono text-xs text-slate-300",
          maxHeight
        )}
      >
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-2.5 py-1 px-1.5 rounded hover:bg-white/[0.03] transition-colors leading-relaxed"
          >
            {/* Timestamp */}
            <span className="text-[11px] text-slate-500 shrink-0 select-none">
              {event.timestamp}
            </span>

            {/* Agent Role Tag */}
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.2 rounded border uppercase tracking-wider font-semibold shrink-0 select-none",
                roleTagColors[event.agentRole]
              )}
            >
              {event.agentRole}
            </span>

            {/* Message Body */}
            <span className="text-xs text-slate-300 font-sans flex-1">
              {event.message}
            </span>
          </div>
        ))}
        <div ref={feedEndRef} />
      </div>
    </div>
  );
}
