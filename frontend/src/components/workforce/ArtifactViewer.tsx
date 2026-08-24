"use client";

import React from "react";
import { TaskContextData, AgentRole } from "@/types/workforce";
import { Badge } from "@/components/ui/Badge";
import { CodeIcon, CheckCircleIcon, ClockIcon, TerminalIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

interface ArtifactViewerProps {
  task: TaskContextData;
  className?: string;
  onClose?: () => void;
}

export function ArtifactViewer({ task, className, onClose }: ArtifactViewerProps) {
  const getContributorBadge = (role: AgentRole) => {
    const roleColors: Record<AgentRole, string> = {
      planner: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      researcher: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      analyst: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      writer: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      reviewer: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    };

    return (
      <span className={cn("text-[10px] font-mono px-1.5 py-0.2 rounded border uppercase", roleColors[role])}>
        @{role}
      </span>
    );
  };

  const getSectionStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge variant="success" size="sm" dot>Verified</Badge>;
      case "reviewing":
        return <Badge variant="accent" size="sm" dot>In Review</Badge>;
      case "drafted":
        return <Badge variant="warning" size="sm">Drafted</Badge>;
      case "pending":
      default:
        return <Badge variant="neutral" size="sm">Pending</Badge>;
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.08] bg-[#0E1017] flex flex-col min-h-0 overflow-hidden text-xs",
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] bg-[#12141C] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CodeIcon className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-slate-200 text-xs">
            Live Working Artifact
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-500">Markdown Output</span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Artifact Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans leading-relaxed">
        <div className="pb-3 border-b border-white/[0.05]">
          <h2 className="text-sm font-bold text-slate-100">
            {task.draftArtifact.title}
          </h2>
          <span className="text-[10px] font-mono text-slate-500 mt-1 block">
            Generated via IntelliFlow Multi-Agent Workforce
          </span>
        </div>

        <div className="space-y-4">
          {task.draftArtifact.sections.map((sec, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg border border-white/[0.05] bg-[#12141C] space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-200">
                  {sec.heading}
                </h3>
                <div className="flex items-center gap-2">
                  {getContributorBadge(sec.contributorRole)}
                  {getSectionStatusBadge(sec.status)}
                </div>
              </div>

              <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                {sec.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
