"use client";

import React from "react";
import { AgentWorkforceMember } from "@/types/workforce";
import { AgentCharacter } from "./AgentCharacter";
import { Badge } from "@/components/ui/Badge";
import {
  CodeIcon,
  CheckCircleIcon,
  ClockIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  TerminalIcon,
  ZapIcon,
} from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

interface AgentWorkstationProps {
  agent: AgentWorkforceMember;
  isSelected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export function AgentWorkstation({
  agent,
  isSelected = false,
  onSelect,
  className,
}: AgentWorkstationProps) {
  const isWorking = agent.state === "working" || agent.state === "planning";
  const isCompleted = agent.state === "completed";
  const isWaiting = agent.state === "waiting" || agent.state === "idle";
  const isFailed = agent.state === "failed";

  const getStatusBadge = () => {
    switch (agent.state) {
      case "completed":
        return (
          <Badge variant="success" size="sm" dot>
            Completed
          </Badge>
        );
      case "working":
        return (
          <Badge variant="accent" size="sm" dot>
            Working
          </Badge>
        );
      case "planning":
        return (
          <Badge variant="accent" size="sm" dot>
            Planning
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="error" size="sm" dot>
            Failed
          </Badge>
        );
      case "waiting":
      case "idle":
      default:
        return (
          <Badge variant="neutral" size="sm">
            Waiting
          </Badge>
        );
    }
  };

  const roleAccentBorder: Record<string, string> = {
    planner: "border-blue-500/40",
    researcher: "border-amber-500/40",
    analyst: "border-emerald-500/40",
    writer: "border-purple-500/40",
    reviewer: "border-pink-500/40",
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative rounded-xl border bg-[#11141C] p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between text-left",
        isWorking
          ? "border-white/[0.18] bg-[#141824] shadow-lg ring-1 ring-blue-500/20"
          : isCompleted
          ? "border-white/[0.09] bg-[#11141C]"
          : "border-white/[0.06] bg-[#0E1017] opacity-65 hover:opacity-90",
        isSelected && cn("ring-2 ring-offset-2 ring-offset-[#0A0B0E]", roleAccentBorder[agent.role]),
        className
      )}
    >
      {/* ── Top Header: Character + Identification ────────── */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <AgentCharacter role={agent.role} state={agent.state} size="md" />

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-slate-100 truncate">
                  {agent.name}
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-white/[0.04] px-1.5 py-0.2 rounded border border-white/[0.05]">
                  {agent.codename}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono capitalize mt-0.5">
                {agent.role}
              </p>
            </div>
          </div>

          <div className="shrink-0">{getStatusBadge()}</div>
        </div>

        {/* ── State Description ────────────────────────────── */}
        <div className="mt-3.5 space-y-1">
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-sans">
            {agent.stateDescription}
          </p>
        </div>

        {/* ── Active Live Output / Thought Stream ──────────── */}
        {agent.outputSnippet && (
          <div className="mt-3 p-2 rounded-lg bg-[#0A0C12] border border-white/[0.05] font-mono text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase">
              <span className="flex items-center gap-1">
                <TerminalIcon className="w-3 h-3 text-slate-500" />
                Live Output Buffer
              </span>
              {agent.activeTool && (
                <span className="text-slate-400 font-mono">
                  tool: {agent.activeTool}
                </span>
              )}
            </div>
            <p className="text-slate-300 line-clamp-2 leading-normal">
              {agent.outputSnippet}
            </p>
          </div>
        )}
      </div>

      {/* ── Bottom Section: Progress + Telemetry ───────────── */}
      <div className="mt-4 pt-3 border-t border-white/[0.05] space-y-2">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Progress</span>
            <span>{agent.progressPercent}%</span>
          </div>
          <div className="w-full h-1 bg-[#1A1E28] rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500",
                isCompleted
                  ? "bg-emerald-500"
                  : isWorking
                  ? "bg-blue-500"
                  : "bg-slate-600"
              )}
              style={{ width: `${agent.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Telemetry micro stats */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5">
          <span>{agent.tokensProcessed.toLocaleString()} tokens</span>
          {agent.latencyMs > 0 && <span>{agent.latencyMs}ms latency</span>}
        </div>
      </div>
    </div>
  );
}
