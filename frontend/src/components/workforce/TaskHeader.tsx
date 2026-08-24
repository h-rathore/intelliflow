"use client";

import React from "react";
import { TaskContextData } from "@/types/workforce";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  PlayIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  ZapIcon,
} from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

interface TaskHeaderProps {
  task: TaskContextData;
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onToggleArtifactViewer?: () => void;
  showArtifactViewer?: boolean;
}

export function TaskHeader({
  task,
  currentStepIndex,
  totalSteps,
  isPlaying,
  onTogglePlay,
  onStepForward,
  onReset,
  onToggleArtifactViewer,
  showArtifactViewer,
}: TaskHeaderProps) {
  const isComplete = currentStepIndex >= totalSteps - 1;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#12141C] p-4 text-xs space-y-3">
      {/* ── Top Bar: Active Mission Label + Controls ──────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Active Workforce Mission
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-[11px] font-mono text-slate-400">
            Stage {currentStepIndex + 1} of {totalSteps}
          </span>
        </div>

        {/* Simulation Execution Controls */}
        <div className="flex items-center gap-2">
          {onToggleArtifactViewer && (
            <Button
              variant={showArtifactViewer ? "primary" : "outline"}
              size="sm"
              onClick={onToggleArtifactViewer}
            >
              {showArtifactViewer ? "Hide Live Draft" : "View Live Draft"}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            title="Reset simulation to initial state"
          >
            Reset
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isComplete}
            onClick={onStepForward}
            title="Step simulation forward"
          >
            Step →
          </Button>

          <Button
            variant={isPlaying ? "subtle" : "primary"}
            size="sm"
            onClick={onTogglePlay}
            icon={
              isPlaying ? (
                <RefreshCwIcon className="w-3.5 h-3.5 animate-spin text-blue-400" />
              ) : (
                <PlayIcon className="w-3 h-3" />
              )
            }
          >
            {isPlaying ? "Simulating..." : isComplete ? "Completed" : "Play Run"}
          </Button>
        </div>
      </div>

      {/* ── Active Task Title & Objective ──────────────────── */}
      <div className="space-y-1">
        <h1 className="text-base sm:text-lg font-semibold text-slate-100 tracking-tight font-sans">
          {task.title}
        </h1>
        <p className="text-xs text-slate-400 font-sans leading-relaxed">
          {task.objective}
        </p>
      </div>

      {/* ── Bottom Telemetry Strip ─────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-white/[0.05] text-[11px] font-mono text-slate-500">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1">
            <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
            Elapsed: <strong className="text-slate-300 font-mono">{task.elapsedTime}</strong>
          </span>
          <span>•</span>
          <span>
            Throughput: <strong className="text-slate-300 font-mono">{task.totalTokens.toLocaleString()} tokens</strong>
          </span>
          <span>•</span>
          <span>
            Confidence: <strong className="text-emerald-400 font-mono">{task.confidenceScore}%</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isComplete ? "success" : "accent"} size="sm" dot>
            {isComplete ? "Certified Complete" : task.activeStage}
          </Badge>
        </div>
      </div>
    </div>
  );
}
