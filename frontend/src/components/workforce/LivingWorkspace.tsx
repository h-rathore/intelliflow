"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AgentRole,
  AgentWorkforceMember,
  ActivityEvent,
  TaskContextData,
} from "@/types/workforce";
import {
  INITIAL_AGENTS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_TASK_CONTEXT,
  SIMULATION_TIMELINE,
} from "@/mock/workforceData";
import { TaskHeader } from "./TaskHeader";
import { WorkflowCanvas } from "./WorkflowCanvas";
import { ActivityFeed } from "./ActivityFeed";
import { ArtifactViewer } from "./ArtifactViewer";
import { AgentCharacter } from "./AgentCharacter";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  TerminalIcon,
  CodeIcon,
  CheckCircleIcon,
  ClockIcon,
  RefreshCwIcon,
  SparklesIcon,
  SlidersIcon,
} from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

export function LivingWorkspace() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [agents, setAgents] = useState<Record<AgentRole, AgentWorkforceMember>>(INITIAL_AGENTS);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>(INITIAL_ACTIVITY_LOGS);
  const [taskContext, setTaskContext] = useState<TaskContextData>(INITIAL_TASK_CONTEXT);
  const [selectedAgentRole, setSelectedAgentRole] = useState<AgentRole>("researcher");
  const [showArtifactViewer, setShowArtifactViewer] = useState(false);

  // Apply a simulation step to agents & state
  const applySimulationStep = useCallback((stepIdx: number) => {
    const step = SIMULATION_TIMELINE[stepIdx];
    if (!step) return;

    setAgents((prev) => {
      const next = { ...prev };
      (Object.keys(step.agentStates) as AgentRole[]).forEach((role) => {
        const stateUpdate = step.agentStates[role];
        next[role] = {
          ...next[role],
          ...stateUpdate,
        };
      });
      return next;
    });

    if (step.newEvents && step.newEvents.length > 0) {
      setActivityEvents((prev) => {
        const existingIds = new Set(prev.map((e: ActivityEvent) => e.id));
        const toAdd = step.newEvents.filter((e: ActivityEvent) => !existingIds.has(e.id));
        return [...prev, ...toAdd];
      });
    }

    setTaskContext((prev) => ({
      ...prev,
      elapsedTime: step.elapsedTime,
      status: stepIdx >= SIMULATION_TIMELINE.length - 1 ? "completed" : "in_progress",
      activeStage: step.label || step.stageName || prev.activeStage,
    }));
  }, []);

  const handleStepForward = useCallback(() => {
    if (currentStepIndex < SIMULATION_TIMELINE.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      applySimulationStep(nextIdx);
    } else {
      setIsPlaying(false);
    }
  }, [currentStepIndex, applySimulationStep]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
    setAgents(INITIAL_AGENTS);
    setActivityEvents(INITIAL_ACTIVITY_LOGS);
    setTaskContext(INITIAL_TASK_CONTEXT);
  }, []);

  // Auto-play timer
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isPlaying) {
      timer = setInterval(() => {
        if (currentStepIndex < SIMULATION_TIMELINE.length - 1) {
          handleStepForward();
        } else {
          setIsPlaying(false);
        }
      }, 4000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, currentStepIndex, handleStepForward]);

  const selectedAgent = agents[selectedAgentRole];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Active Task Context & Playback Controls ─────────── */}
      <TaskHeader
        task={taskContext}
        currentStepIndex={currentStepIndex}
        totalSteps={SIMULATION_TIMELINE.length}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((prev) => !prev)}
        onStepForward={handleStepForward}
        onReset={handleReset}
        onToggleArtifactViewer={() => setShowArtifactViewer((prev) => !prev)}
        showArtifactViewer={showArtifactViewer}
      />

      {/* ── Main Living Workspace Grid ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left / Center Canvas: Visual Workforce Topology (8 cols) ── */}
        <div
          className={cn(
            "transition-all duration-300",
            showArtifactViewer ? "lg:col-span-6" : "lg:col-span-8"
          )}
        >
          <div className="rounded-2xl border border-white/[0.08] bg-[#0A0C13] p-4 sm:p-6 shadow-2xl relative overflow-hidden">
            {/* Subtle topology background grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-slate-200 uppercase tracking-wider">
                    Collaborative AI Workforce
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Click any agent to inspect buffer
                </span>
              </div>

              {/* 5-Agent Topology Canvas */}
              <WorkflowCanvas
                agents={agents}
                selectedAgentRole={selectedAgentRole}
                onSelectAgent={(role) => setSelectedAgentRole(role)}
              />
            </div>
          </div>
        </div>

        {/* ── Right Column: Selected Agent Inspector + Live Feed (4 or 6 cols) ── */}
        <div
          className={cn(
            "space-y-4 transition-all duration-300",
            showArtifactViewer ? "lg:col-span-6" : "lg:col-span-4"
          )}
        >
          {/* Conditional Live Working Artifact Drawer */}
          {showArtifactViewer ? (
            <ArtifactViewer
              task={taskContext}
              className="h-[520px]"
              onClose={() => setShowArtifactViewer(false)}
            />
          ) : (
            <>
              {/* Selected Agent Telemetry Inspector */}
              <div className="rounded-xl border border-white/[0.08] bg-[#12141C] p-4 text-xs font-mono space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Workstation Inspector
                    </span>
                  </div>
                  <Badge variant="neutral" size="sm">
                    {selectedAgent.codename}
                  </Badge>
                </div>

                <div className="flex items-start gap-3">
                  <AgentCharacter
                    role={selectedAgent.role}
                    state={selectedAgent.state}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-100 text-sm font-sans truncate">
                      {selectedAgent.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono capitalize">
                      {selectedAgent.role} • {selectedAgent.specialty}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge
                        variant={
                          selectedAgent.state === "completed"
                            ? "success"
                            : selectedAgent.state === "working"
                            ? "accent"
                            : "neutral"
                        }
                        size="sm"
                        dot
                      >
                        {selectedAgent.state}
                      </Badge>
                      {selectedAgent.activeTool && (
                        <span className="text-[10px] text-slate-400 bg-white/[0.04] px-1.5 py-0.2 rounded border border-white/[0.05]">
                          {selectedAgent.activeTool}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reasoning & Current Thought */}
                {selectedAgent.currentThought && (
                  <div className="space-y-1 pt-1">
                    <div className="text-[10px] text-slate-500 uppercase">
                      Cognitive Reasoning Stream
                    </div>
                    <div className="p-2.5 rounded bg-[#0A0C12] border border-white/[0.05] text-slate-300 text-[11px] leading-relaxed font-sans">
                      {selectedAgent.currentThought}
                    </div>
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.05] text-[11px]">
                  <div className="p-2 rounded bg-[#0A0C12] border border-white/[0.04]">
                    <span className="text-[10px] text-slate-500 uppercase block">Processed</span>
                    <span className="font-semibold text-slate-200">
                      {selectedAgent.tokensProcessed.toLocaleString()} tokens
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[#0A0C12] border border-white/[0.04]">
                    <span className="text-[10px] text-slate-500 uppercase block">Latency</span>
                    <span className="font-semibold text-slate-200">
                      {selectedAgent.latencyMs}ms
                    </span>
                  </div>
                </div>
              </div>

              {/* Compact Live Activity Stream Feed */}
              <ActivityFeed events={activityEvents} maxHeight="h-64" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
