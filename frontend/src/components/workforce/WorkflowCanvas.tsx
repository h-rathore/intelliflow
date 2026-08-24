"use client";

import React from "react";
import { AgentRole, AgentWorkforceMember } from "@/types/workforce";
import { AgentWorkstation } from "./AgentWorkstation";
import { ArrowRightIcon, ZapIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

interface WorkflowCanvasProps {
  agents: Record<AgentRole, AgentWorkforceMember>;
  selectedAgentRole?: AgentRole;
  onSelectAgent?: (role: AgentRole) => void;
  className?: string;
}

export function WorkflowCanvas({
  agents,
  selectedAgentRole,
  onSelectAgent,
  className,
}: WorkflowCanvasProps) {
  const planner = agents.planner;
  const researcher = agents.researcher;
  const analyst = agents.analyst;
  const writer = agents.writer;
  const reviewer = agents.reviewer;

  // Active flow logic
  const isPlannerToParallelActive = planner.state === "completed" && (researcher.state === "working" || analyst.state === "working");
  const isParallelToWriterActive = (researcher.state === "completed" || analyst.state === "completed") && writer.state === "working";
  const isWriterToReviewerActive = writer.state === "completed" && reviewer.state === "working";

  return (
    <div className={cn("relative space-y-6", className)}>
      {/* ── Visual Spatial Topology of the Workforce ──────── */}
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Level 1: Planner (Orchestrator Node) */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1 text-center flex items-center justify-center gap-1.5">
              <span>01. Task Decomposition & Routing</span>
            </div>
            <AgentWorkstation
              agent={planner}
              isSelected={selectedAgentRole === "planner"}
              onSelect={() => onSelectAgent?.("planner")}
            />
          </div>

          {/* Animated Connecting Branch from Planner down to Researcher + Analyst */}
          <div className="flex flex-col items-center my-2 select-none">
            <div
              className={cn(
                "w-0.5 h-6 transition-colors duration-300",
                planner.state === "completed" ? "bg-blue-500" : "bg-white/[0.12]"
              )}
            />
            {/* Split Horizontal Bar */}
            <div className="w-72 sm:w-96 h-0.5 bg-white/[0.12] relative">
              {isPlannerToParallelActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" />
              )}
            </div>
            {/* Dual Drop Pins */}
            <div className="w-72 sm:w-96 flex justify-between">
              <div
                className={cn(
                  "w-0.5 h-4",
                  researcher.state === "working" || researcher.state === "completed"
                    ? "bg-amber-500"
                    : "bg-white/[0.12]"
                )}
              />
              <div
                className={cn(
                  "w-0.5 h-4",
                  analyst.state === "working" || analyst.state === "completed"
                    ? "bg-emerald-500"
                    : "bg-white/[0.12]"
                )}
              />
            </div>
          </div>
        </div>

        {/* Level 2: Parallel Discovery & Analysis (Researcher + Analyst) */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5 text-center flex items-center justify-center gap-2">
            <span>02. Parallel Execution Nodes</span>
            <span className="text-blue-400 font-bold">• Concurrent</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <AgentWorkstation
              agent={researcher}
              isSelected={selectedAgentRole === "researcher"}
              onSelect={() => onSelectAgent?.("researcher")}
            />

            <AgentWorkstation
              agent={analyst}
              isSelected={selectedAgentRole === "analyst"}
              onSelect={() => onSelectAgent?.("analyst")}
            />
          </div>

          {/* Animated Connecting Merge from Researcher + Analyst down to Writer */}
          <div className="flex flex-col items-center my-2 select-none">
            {/* Dual Drop Pins down */}
            <div className="w-72 sm:w-96 flex justify-between">
              <div
                className={cn(
                  "w-0.5 h-4",
                  researcher.state === "completed" ? "bg-amber-500" : "bg-white/[0.12]"
                )}
              />
              <div
                className={cn(
                  "w-0.5 h-4",
                  analyst.state === "completed" ? "bg-emerald-500" : "bg-white/[0.12]"
                )}
              />
            </div>
            {/* Merge Horizontal Bar */}
            <div className="w-72 sm:w-96 h-0.5 bg-white/[0.12] relative">
              {isParallelToWriterActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-purple-400 to-emerald-400 animate-pulse" />
              )}
            </div>
            {/* Center Drop to Writer */}
            <div
              className={cn(
                "w-0.5 h-6 transition-colors duration-300",
                writer.state === "working" || writer.state === "completed"
                  ? "bg-purple-500"
                  : "bg-white/[0.12]"
              )}
            />
          </div>
        </div>

        {/* Level 3: Writer (Document Synthesis Node) */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1 text-center">
              03. Document Compilation & Synthesis
            </div>
            <AgentWorkstation
              agent={writer}
              isSelected={selectedAgentRole === "writer"}
              onSelect={() => onSelectAgent?.("writer")}
            />
          </div>

          {/* Animated Conduit from Writer to Reviewer */}
          <div className="flex flex-col items-center my-2 select-none">
            <div
              className={cn(
                "w-0.5 h-6 transition-colors duration-300",
                reviewer.state === "working" || reviewer.state === "completed"
                  ? "bg-pink-500"
                  : "bg-white/[0.12]"
              )}
            />
            {isWriterToReviewerActive && (
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-ping -mt-3 mb-1" />
            )}
          </div>
        </div>

        {/* Level 4: Reviewer (Audit & Fact-Check Node) */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1 text-center">
              04. Verification & Citation Audit
            </div>
            <AgentWorkstation
              agent={reviewer}
              isSelected={selectedAgentRole === "reviewer"}
              onSelect={() => onSelectAgent?.("reviewer")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
