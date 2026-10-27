"use client";

import React, { useState } from "react";
import { useWorkflowRunner } from "@/lib/useWorkflowRunner";
import { AgentRole } from "@/types/workforce";
import { WorkflowCanvas } from "@/components/workforce/WorkflowCanvas";
import { ActivityFeed } from "@/components/workforce/ActivityFeed";
import { ArtifactViewer } from "@/components/workforce/ArtifactViewer";
import { AgentCharacter } from "@/components/workforce/AgentCharacter";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  PlayIcon,
  SparklesIcon,
  TerminalIcon,
  RefreshCwIcon,
  SlidersIcon,
  ArrowRightIcon,
  ClockIcon,
  CheckCircleIcon,
  CodeIcon,
} from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

const STARTER_PROMPTS = [
  {
    title: "Enterprise AI Automation Landscape",
    prompt: "Research the top AI automation companies and prepare a competitive analysis.",
    category: "Market Research",
  },
  {
    title: "Pull Request AST & Security Audit",
    prompt: "Audit incoming pull request diffs, execute static AST linters, and generate pytest regression suites.",
    category: "Code & Testing",
  },
  {
    title: "SEC 10-K Quantitative Financial Extractor",
    prompt: "Ingest multi-page corporate balance sheets, extract GAAP tables, and run Python verification equations.",
    category: "Data Extraction",
  },
  {
    title: "Support Ticket Intent Router & Escalation",
    prompt: "Evaluate customer support tickets, score sentiment urgency, and dispatch CRM alerts to Tier-2 engineers.",
    category: "Operations",
  },
];

export function CommandWorkspace() {
  const [promptInput, setPromptInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("claude-3-5-sonnet");
  const [executionMode, setExecutionMode] = useState<"autonomous" | "step-by-step">("autonomous");
  const [isWorkspaceActive, setIsWorkspaceActive] = useState(false);
  const [selectedAgentRole, setSelectedAgentRole] = useState<AgentRole>("researcher");
  const [showArtifactViewer, setShowArtifactViewer] = useState(false);

  const {
    isRunning,
    setIsRunning,
    currentStageIndex,
    totalStages,
    agents,
    activityEvents,
    taskContext,
    startTask,
    stepForward,
    resetTask,
  } = useWorkflowRunner();

  // Launch a workflow from custom prompt or starter
  const handleLaunch = (textToRun?: string) => {
    const target = textToRun || promptInput;
    if (!target.trim()) return;

    startTask(target, executionMode, selectedModel);
    setIsWorkspaceActive(true);
  };

  const handleReturnToCommand = () => {
    resetTask();
    setIsWorkspaceActive(false);
  };

  const selectedAgent = agents[selectedAgentRole];
  const isComplete = currentStageIndex >= totalStages - 1;
  const isFailed = taskContext.status === "failed";
  const sections = taskContext.draftArtifact?.sections ?? [];
  const isArtifactVerified =
    sections.length > 0 && sections.every((s) => s.status === "verified");

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ─────────────────────────────────────────────────── */}
      {/* MODE A: INITIAL COMMAND WORKSPACE (ENTRY POINT)    */}
      {/* ─────────────────────────────────────────────────── */}
      {!isWorkspaceActive ? (
        <div className="space-y-8 pt-4 sm:pt-8 max-w-4xl mx-auto animate-in-subtle">
          {/* Header & Vision */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-[#12141C] text-xs font-mono text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span>IntelliFlow Autonomous Workforce</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-100 font-sans">
              What do you want your AI team to accomplish?
            </h1>

            <p className="text-sm text-slate-400 max-w-xl mx-auto font-sans leading-relaxed">
              Describe an objective in natural language. Planner, Researcher, Analyst, Writer, and Reviewer will coordinate to complete it.
            </p>
          </div>

          {/* Primary Command Input Area */}
          <div className="rounded-2xl border border-white/[0.1] bg-[#12141C] p-4 shadow-2xl transition-all focus-within:border-blue-500/50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLaunch();
              }}
              className="space-y-3"
            >
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Describe a goal, research mission, or automated pipeline in natural language..."
                rows={3}
                className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 resize-none border-0 focus:ring-0 focus:outline-none leading-relaxed p-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleLaunch();
                  }
                }}
              />

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-white/[0.06] text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Model Selector */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181B24] border border-white/[0.08] text-slate-300">
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Engine:</span>
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

                  {/* Mode Selector */}
                  <div className="flex items-center gap-1 bg-[#181B24] border border-white/[0.08] p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setExecutionMode("autonomous")}
                      className={cn(
                        "px-2.5 py-1 rounded-md transition-colors text-[11px]",
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
                        "px-2.5 py-1 rounded-md transition-colors text-[11px]",
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
                    ⌘+Enter to launch
                  </span>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={!promptInput.trim()}
                    icon={<PlayIcon className="w-3.5 h-3.5" />}
                  >
                    Launch Workforce →
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Starter Scenario Templates */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
              Suggested Mission Templates
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STARTER_PROMPTS.map((starter, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPromptInput(starter.prompt);
                    handleLaunch(starter.prompt);
                  }}
                  className="group p-3.5 rounded-xl border border-white/[0.07] bg-[#12141A] hover:bg-[#161922] hover:border-blue-500/40 text-left transition-all flex flex-col justify-between gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      {starter.category}
                    </span>
                    <ArrowRightIcon className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="text-xs font-semibold text-slate-200 group-hover:text-white">
                    {starter.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {starter.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* AI Workforce Readiness Roster */}
          <div className="rounded-xl border border-white/[0.06] bg-[#0E1017] p-4 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-2 text-slate-400 text-[11px]">
              <span>ACTIVE WORKFORCE STANDBY ROSTER</span>
              <span className="text-emerald-400">5 Agents Primed</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3">
              {(["planner", "researcher", "analyst", "writer", "reviewer"] as AgentRole[]).map((role) => (
                <div key={role} className="flex flex-col items-center text-center p-2 rounded-lg bg-[#12141C] border border-white/[0.04]">
                  <AgentCharacter role={role} state="idle" size="sm" />
                  <span className="font-semibold text-slate-200 text-xs mt-1.5 capitalize font-sans">
                    {agents[role].name}
                  </span>
                  <span className="text-[10px] text-slate-500 capitalize">
                    {role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────── */
        /* MODE B: VISUAL EXECUTION STAGE ENVIRONMENT          */
        /* ─────────────────────────────────────────────────── */
        <div className="space-y-6 animate-in-subtle">
          {/* Top Mission Control Bar */}
          <div className="rounded-xl border border-white/[0.08] bg-[#12141C] p-4 text-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Executing Mission
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-[11px] font-mono text-slate-300">
                  {taskContext.activeStage}
                </span>
              </div>

              {/* Execution Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant={showArtifactViewer ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setShowArtifactViewer(!showArtifactViewer)}
                >
                  {showArtifactViewer ? "Hide Live Draft" : "View Live Draft"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={isComplete}
                  onClick={stepForward}
                  title="Step execution forward"
                >
                  Step →
                </Button>

                <Button
                  variant={isRunning ? "subtle" : "primary"}
                  size="sm"
                  onClick={() => setIsRunning(!isRunning)}
                  icon={
                    isRunning ? (
                      <RefreshCwIcon className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    ) : (
                      <PlayIcon className="w-3 h-3" />
                    )
                  }
                >
                  {isRunning ? "Running..." : isComplete ? "Completed" : "Resume"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReturnToCommand}
                >
                  New Mission
                </Button>
              </div>
            </div>

            {/* Task Description */}
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-100 font-sans tracking-tight">
                {taskContext.title}
              </h2>
            </div>

            {/* Telemetry Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-white/[0.05] text-[11px] font-mono text-slate-500">
              <div className="flex items-center gap-4 flex-wrap">
                <span>
                  Elapsed: <strong className="text-slate-300">{taskContext.elapsedTime}</strong>
                </span>
                <span>•</span>
                <span>
                  Throughput: <strong className="text-slate-300">{taskContext.totalTokens.toLocaleString()} tokens</strong>
                </span>
                <span>•</span>
                <span>
                  Confidence: <strong className="text-emerald-400">{taskContext.confidenceScore}%</strong>
                </span>
              </div>

              {isFailed ? (
                <Badge variant="error" size="sm" dot>
                  Execution Failed
                </Badge>
              ) : isComplete ? (
                isArtifactVerified ? (
                  <Badge variant="success" size="sm" dot>
                    Execution Certified
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm" dot>
                    Execution Completed — Draft Unverified
                  </Badge>
                )
              ) : (
                <Badge variant="accent" size="sm" dot>
                  {`Stage ${currentStageIndex + 1} of ${totalStages}`}
                </Badge>
              )}
            </div>
          </div>

          {/* Main Visual Stage Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Visual Canvas (8 cols or 6 cols when artifact drawer is open) */}
            <div className={cn("transition-all duration-300", showArtifactViewer ? "lg:col-span-6" : "lg:col-span-8")}>
              <div className="rounded-2xl border border-white/[0.08] bg-[#0A0C13] p-4 sm:p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs font-mono text-slate-400">
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-slate-200 uppercase tracking-wider">
                        Live Workforce Topology
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Click any agent to inspect thoughts
                    </span>
                  </div>

                  {/* 5-Agent Spatial DAG Canvas */}
                  <WorkflowCanvas
                    agents={agents}
                    selectedAgentRole={selectedAgentRole}
                    onSelectAgent={(role) => setSelectedAgentRole(role)}
                  />
                </div>
              </div>
            </div>

            {/* Right Pane: Inspector / Live Feed / Artifact */}
            <div className={cn("space-y-4 transition-all duration-300", showArtifactViewer ? "lg:col-span-6" : "lg:col-span-4")}>
              {showArtifactViewer ? (
                <ArtifactViewer
                  task={taskContext}
                  className="h-[520px]"
                  onClose={() => setShowArtifactViewer(false)}
                />
              ) : (
                <>
                  {/* Selected Agent Inspector */}
                  <div className="rounded-xl border border-white/[0.08] bg-[#12141C] p-4 text-xs font-mono space-y-3 shadow-lg">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-slate-400">
                      <span className="text-[10px] uppercase font-semibold text-slate-500">
                        Workstation Telemetry
                      </span>
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
                                : selectedAgent.state === "working" || selectedAgent.state === "thinking"
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

                    {/* Agent Thought Stream */}
                    {selectedAgent.currentThought && (
                      <div className="space-y-1 pt-1">
                        <div className="text-[10px] text-slate-500 uppercase">
                          Reasoning Trace
                        </div>
                        <div className="p-2.5 rounded bg-[#0A0C12] border border-white/[0.05] text-slate-300 text-[11px] leading-relaxed font-sans">
                          {selectedAgent.currentThought}
                        </div>
                      </div>
                    )}

                    {/* Micro telemetry */}
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

                  {/* Compact Live Activity Feed */}
                  <ActivityFeed events={activityEvents} maxHeight="h-60" />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
