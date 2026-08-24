"use client";

import React, { useState } from "react";
import {
  PlayIcon,
  SparklesIcon,
  TerminalIcon,
  WorkflowsIcon,
  AgentsIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  ArrowRightIcon,
  SlidersIcon,
  CodeIcon,
} from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { WorkflowItem, ExecutionStatus } from "@/types";
import { cn } from "@/lib/utils";

interface CommandCenterProps {
  onSelectWorkflow: (workflowId: string) => void;
  onNavigateTab: (tab: "workflows" | "agents" | "activity") => void;
}

const EXAMPLE_PROMPTS = [
  "Extract quarterly revenue tables from uploaded PDF reports and validate via Python",
  "Monitor GitHub repository issues, classify bugs with Claude 3.5, and draft PR fixes",
  "Build an autonomous competitor pricing scraper with Slack alert triggers on delta > 5%",
  "Ingest Zendesk support tickets, summarize customer intent, and route to tier-2 engineers",
];

const INITIAL_RECENT_WORKFLOWS: WorkflowItem[] = [
  {
    id: "wf-1",
    name: "Customer Support Triaging & Dispatch",
    description: "Evaluates incoming high-priority tickets, parses customer sentiment, and triggers CRM dispatch.",
    status: "completed",
    stepsCount: 4,
    steps: [],
    primaryAgent: "SupportRouter-v2",
    lastRunAt: "3 mins ago",
    duration: "1.4s",
    triggerType: "webhook",
    successRate: 99.8,
  },
  {
    id: "wf-2",
    name: "Financial PDF Vector Indexing Pipeline",
    description: "Extracts multi-page tabular balance sheets, generates chunk embeddings, and validates schema.",
    status: "running",
    stepsCount: 6,
    steps: [],
    primaryAgent: "DocParser-Alpha",
    lastRunAt: "Active now",
    duration: "Running (42s)",
    triggerType: "event",
    successRate: 98.4,
  },
  {
    id: "wf-3",
    name: "Automated PR Code Review & Test Generation",
    description: "Runs static AST checks on incoming pull requests, drafts pytest test cases, and posts GitHub comments.",
    status: "completed",
    stepsCount: 5,
    steps: [],
    primaryAgent: "CodeReviewer-Agent",
    lastRunAt: "28 mins ago",
    duration: "3.8s",
    triggerType: "webhook",
    successRate: 100,
  },
  {
    id: "wf-4",
    name: "Nightly Database Backup & Integrity Verification",
    description: "Executes pg_dump backup snapshot, restores into sandbox container, and runs validation suite.",
    status: "pending",
    stepsCount: 3,
    steps: [],
    primaryAgent: "OpsExecutor-Agent",
    lastRunAt: "Scheduled (02:00 UTC)",
    duration: "Queued",
    triggerType: "cron",
    successRate: 99.1,
  },
];

export function CommandCenter({
  onSelectWorkflow,
  onNavigateTab,
}: CommandCenterProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("claude-3-5-sonnet");
  const [executionMode, setExecutionMode] = useState<"autonomous" | "step-by-step">("autonomous");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<string | null>(null);
  const [workflows] = useState<WorkflowItem[]>(INITIAL_RECENT_WORKFLOWS);

  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isExecuting) return;

    setIsExecuting(true);
    setExecutionLog(`Analyzing intent: "${prompt}"... Initializing DAG plan with model [${selectedModel}].`);

    setTimeout(() => {
      setIsExecuting(false);
      setExecutionLog(
        `Generated workflow skeleton with 4 nodes. Routed primary reasoning to agent [RouterAgent]. Click 'Workflows' to inspect graph.`
      );
    }, 1800);
  };

  const getStatusBadge = (status: ExecutionStatus) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="success" size="sm" dot>
            Completed
          </Badge>
        );
      case "running":
        return (
          <Badge variant="accent" size="sm" dot>
            Running
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="error" size="sm" dot>
            Failed
          </Badge>
        );
      case "pending":
      case "idle":
      default:
        return (
          <Badge variant="neutral" size="sm">
            Queued
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* ── 1. Contextual Header ─────────────────────────── */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span>AI ORCHESTRATION OS</span>
          <span>•</span>
          <span className="text-emerald-400">READY</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-100 tracking-tight">
          What do you want IntelliFlow to accomplish?
        </h1>
        <p className="text-xs text-slate-400">
          Describe an automation goal, data pipeline, or multi-agent task in natural language.
        </p>
      </div>

      {/* ── 2. Primary AI Command Area ──────────────────── */}
      <div className="rounded-xl border border-white/[0.1] bg-[#12141A] p-3 shadow-xl transition-all focus-within:border-blue-500/50">
        <form onSubmit={handleRunCommand} className="space-y-3">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe a workflow, multi-agent pipeline, or system automation goal..."
              rows={3}
              className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 resize-none border-0 focus:ring-0 focus:outline-none leading-relaxed p-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleRunCommand(e);
                }
              }}
            />
          </div>

          {/* Bottom Bar Controls inside Prompt Box */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06] text-xs">
            <div className="flex items-center gap-2">
              {/* Model Selector */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#181B24] border border-white/[0.08] text-slate-300">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Model:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 border-0 focus:outline-none cursor-pointer"
                >
                  <option value="claude-3-5-sonnet" className="bg-[#181B24] text-slate-200">
                    Claude 3.5 Sonnet
                  </option>
                  <option value="gpt-4o" className="bg-[#181B24] text-slate-200">
                    GPT-4o
                  </option>
                  <option value="deepseek-r1" className="bg-[#181B24] text-slate-200">
                    DeepSeek R1
                  </option>
                </select>
              </div>

              {/* Execution Mode */}
              <div className="flex items-center gap-1 bg-[#181B24] border border-white/[0.08] p-0.5 rounded text-xs">
                <button
                  type="button"
                  onClick={() => setExecutionMode("autonomous")}
                  className={cn(
                    "px-2 py-0.5 rounded transition-colors text-[11px]",
                    executionMode === "autonomous"
                      ? "bg-blue-600 text-white font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  Autonomous
                </button>
                <button
                  type="button"
                  onClick={() => setExecutionMode("step-by-step")}
                  className={cn(
                    "px-2 py-0.5 rounded transition-colors text-[11px]",
                    executionMode === "step-by-step"
                      ? "bg-blue-600 text-white font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  Step-by-Step
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[11px] text-slate-500 font-mono">
                Press ⌘+Enter to run
              </span>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!prompt.trim() || isExecuting}
                icon={
                  isExecuting ? (
                    <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <PlayIcon className="w-3 h-3" />
                  )
                }
              >
                {isExecuting ? "Synthesizing Plan..." : "Execute →"}
              </Button>
            </div>
          </div>
        </form>

        {/* Real-time execution feedback trace */}
        {executionLog && (
          <div className="mt-3 p-2.5 rounded bg-[#0A0B0E] border border-white/[0.08] font-mono text-xs text-slate-300 flex items-start gap-2 animate-in-subtle">
            <TerminalIcon className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{executionLog}</div>
            <button
              onClick={() => onNavigateTab("workflows")}
              className="text-[11px] text-blue-400 hover:underline shrink-0"
            >
              Open Pipeline →
            </button>
          </div>
        )}
      </div>

      {/* ── 3. Example Prompt Suggestions (When Empty) ───── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 uppercase tracking-wider">
          <SparklesIcon className="w-3.5 h-3.5 text-slate-400" />
          <span>Suggested Automations</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EXAMPLE_PROMPTS.map((example, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(example)}
              className="group p-2.5 rounded-lg border border-white/[0.06] bg-[#12141A]/70 hover:bg-[#181B24] hover:border-white/[0.12] text-left transition-colors flex items-start justify-between gap-2"
            >
              <span className="text-xs text-slate-300 group-hover:text-slate-100 leading-relaxed">
                {example}
              </span>
              <ArrowRightIcon className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. Recent Workflows & Active Executions ──────── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
          <div className="flex items-center gap-2">
            <WorkflowsIcon className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Recent Workflows & Active Runs
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab("workflows")}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-medium"
          >
            <span>All Workflows</span>
            <span>→</span>
          </button>
        </div>

        <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-[#12141A] overflow-hidden">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              onClick={() => onSelectWorkflow(wf.id)}
              className="p-3.5 hover:bg-[#171A22] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-slate-200 group-hover:text-blue-300 transition-colors truncate">
                    {wf.name}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 bg-white/[0.04] px-1.5 py-0.2 rounded border border-white/[0.05]">
                    {wf.stepsCount} steps
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  {wf.description}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <AgentsIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{wf.primaryAgent}</span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                  <ClockIcon className="w-3.5 h-3.5" />
                  <span>{wf.lastRunAt}</span>
                </div>

                <div className="min-w-20 text-right">
                  {getStatusBadge(wf.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. System Fleet Overview (Minimal, Developer-Centric) ─ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="p-3 rounded-lg border border-white/[0.08] bg-[#12141A] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
            Active Fleet
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-semibold text-slate-200">6 Agents</span>
            <button
              onClick={() => onNavigateTab("agents")}
              className="text-[11px] text-blue-400 hover:underline font-medium"
            >
              Manage Fleet →
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            DocParser, SupportRouter, CodeReviewer, QA-Validator online
          </p>
        </div>

        <div className="p-3 rounded-lg border border-white/[0.08] bg-[#12141A] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
            Execution Queue
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-semibold text-slate-200">1 Running · 1 Queued</span>
            <button
              onClick={() => onNavigateTab("activity")}
              className="text-[11px] text-blue-400 hover:underline font-medium"
            >
              Live Stream →
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Financial PDF Vector Indexing in progress (step 3/6)
          </p>
        </div>

        <div className="p-3 rounded-lg border border-white/[0.08] bg-[#12141A] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
            Backend Engine
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-semibold text-emerald-400">FastAPI Online</span>
            <span className="text-[11px] font-mono text-slate-500">PORT 8000</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono truncate">
            /api/v1/health verified
          </p>
        </div>
      </div>
    </div>
  );
}
