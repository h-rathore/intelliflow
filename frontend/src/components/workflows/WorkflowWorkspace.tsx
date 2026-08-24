"use client";

import React, { useState } from "react";
import {
  WorkflowsIcon,
  PlayIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  RefreshCwIcon,
  CodeIcon,
  TerminalIcon,
  ChevronRightIcon,
  AgentsIcon,
  SlidersIcon,
  PlusIcon,
  SparklesIcon,
} from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { WorkflowItem, WorkflowStep } from "@/types";
import { cn } from "@/lib/utils";

const SAMPLE_WORKFLOWS: WorkflowItem[] = [
  {
    id: "wf-1",
    name: "Customer Support Triaging & Dispatch",
    description: "Evaluates incoming high-priority tickets, parses sentiment, assigns agent, and outputs CRM updates.",
    status: "completed",
    stepsCount: 4,
    primaryAgent: "SupportRouter-v2",
    lastRunAt: "3 mins ago",
    triggerType: "webhook",
    successRate: 99.8,
    steps: [
      {
        id: "step-1",
        name: "Webhook Ingestion & Payload Validation",
        type: "trigger",
        status: "completed",
        durationMs: 45,
        config: { source: "Zendesk API", format: "JSON", rateLimit: "100/min" },
        logs: [
          "Received payload for ticket #ZD-84920",
          "Extracted customer metadata and raw message content (384 tokens)",
          "Payload validated against schema v2.1.0",
        ],
      },
      {
        id: "step-2",
        name: "Intent Classification & Sentiment Analysis",
        type: "agent",
        agentAssigned: "SupportRouter-v2",
        status: "completed",
        durationMs: 420,
        config: { model: "claude-3-5-sonnet", temperature: 0.1, toolBound: "sentiment_lexicon" },
        logs: [
          "Reasoning: Customer reports blocking checkout error on iOS app v4.2.1.",
          "Classified intent: 'BILLING_PAYMENT_FAILURE' (confidence: 0.984)",
          "Sentiment scored: -0.72 (Urgent / Frustrated)",
        ],
      },
      {
        id: "step-3",
        name: "Priority Router & SLA Decision Gate",
        type: "condition",
        status: "completed",
        durationMs: 12,
        config: { condition: "urgency > 0.7 AND tier == Enterprise", route: "Tier2_Escalation" },
        logs: [
          "Evaluating condition: enterprise tier account identified.",
          "SLA target: 15 minutes response time.",
          "Routing to Tier-2 Billing Operations pool.",
        ],
      },
      {
        id: "step-4",
        name: "CRM Dispatch & Slack Alert Broadcast",
        type: "action",
        status: "completed",
        durationMs: 180,
        config: { channel: "#ops-billing-alerts", notifyRole: "@oncall-eng" },
        logs: [
          "Dispatched event payload to Salesforce Service Cloud.",
          "Posted high-priority alert card to Slack #ops-billing-alerts.",
          "Workflow run finalized successfully in 657ms.",
        ],
      },
    ],
  },
  {
    id: "wf-2",
    name: "Financial PDF Vector Indexing Pipeline",
    description: "Extracts tabular sheets from SEC 10-K filings, generates chunk embeddings, and validates schema.",
    status: "running",
    stepsCount: 5,
    primaryAgent: "DocParser-Alpha",
    lastRunAt: "Active now",
    triggerType: "event",
    successRate: 98.4,
    steps: [
      {
        id: "step-1",
        name: "S3 PDF Document Download",
        type: "trigger",
        status: "completed",
        durationMs: 120,
        config: { bucket: "corp-filings-raw", file: "Q3_2025_Report.pdf", size: "4.8MB" },
        logs: ["Downloaded Q3_2025_Report.pdf from S3", "Verified MD5 checksum: 8a4f91e..."],
      },
      {
        id: "step-2",
        name: "Document Layout OCR & Table Extractor",
        type: "agent",
        agentAssigned: "DocParser-Alpha",
        status: "completed",
        durationMs: 1250,
        config: { engine: "Nougat-OCR", tablesFound: 14 },
        logs: [
          "Extracted 32 pages from document",
          "Isolated 14 tabular financial balance sheets",
          "Parsed tables into structured markdown format",
        ],
      },
      {
        id: "step-3",
        name: "Python Numeric Integrity Verification",
        type: "transform",
        status: "running",
        durationMs: 840,
        config: { sandbox: "python-repl-sandbox", ruleset: "GAAP_Financial_Rules" },
        logs: [
          "Executing Python sandbox verification script...",
          "Validating: Total Assets == Total Liabilities + Stockholders Equity",
          "Processing Row 18 of 24...",
        ],
      },
      {
        id: "step-4",
        name: "Embedding Generation & Vector Upsert",
        type: "agent",
        agentAssigned: "Embeddings-Worker",
        status: "pending",
        config: { dimensions: 1536, targetVectorDb: "Pinecone-Cluster-1" },
        logs: ["Awaiting completion of step 3..."],
      },
      {
        id: "step-5",
        name: "Index Ready Webhook Notification",
        type: "output",
        status: "pending",
        config: { targetEndpoint: "https://api.internal/v1/indexing-complete" },
        logs: ["Pending upstream execution"],
      },
    ],
  },
];

interface WorkflowWorkspaceProps {
  initialWorkflowId?: string;
}

export function WorkflowWorkspace({
  initialWorkflowId,
}: WorkflowWorkspaceProps) {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(SAMPLE_WORKFLOWS);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(
    initialWorkflowId || SAMPLE_WORKFLOWS[0].id
  );

  const currentWorkflow =
    workflows.find((w) => w.id === selectedWorkflowId) || workflows[0];
  const [selectedStepId, setSelectedStepId] = useState<string>(
    currentWorkflow.steps[0]?.id || ""
  );
  const [isTestRunning, setIsTestRunning] = useState(false);

  const selectedStep =
    currentWorkflow.steps.find((s) => s.id === selectedStepId) ||
    currentWorkflow.steps[0];

  const handleTriggerTestRun = () => {
    setIsTestRunning(true);
    setTimeout(() => {
      setIsTestRunning(false);
    }, 1500);
  };

  const getStepTypeBadge = (type: WorkflowStep["type"]) => {
    switch (type) {
      case "trigger":
        return <Badge variant="neutral" size="sm">Trigger</Badge>;
      case "agent":
        return <Badge variant="accent" size="sm">AI Agent</Badge>;
      case "transform":
        return <Badge variant="info" size="sm">Transform</Badge>;
      case "condition":
        return <Badge variant="warning" size="sm">Condition</Badge>;
      case "action":
      case "output":
        return <Badge variant="success" size="sm">Action</Badge>;
    }
  };

  const getStatusIcon = (status: WorkflowStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />;
      case "running":
        return <RefreshCwIcon className="w-3.5 h-3.5 text-blue-400 animate-spin" />;
      case "failed":
        return <AlertCircleIcon className="w-3.5 h-3.5 text-rose-400" />;
      case "pending":
      case "idle":
      default:
        return <ClockIcon className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] space-y-4">
      {/* ── Workflow Header & Toolbar ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <WorkflowsIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <select
                value={selectedWorkflowId}
                onChange={(e) => {
                  setSelectedWorkflowId(e.target.value);
                  const nextWf = workflows.find((w) => w.id === e.target.value);
                  if (nextWf && nextWf.steps.length > 0) {
                    setSelectedStepId(nextWf.steps[0].id);
                  }
                }}
                className="text-base font-semibold text-slate-100 bg-[#12141A] border border-white/[0.1] rounded px-2.5 py-1 focus:outline-none cursor-pointer"
              >
                {workflows.map((wf) => (
                  <option key={wf.id} value={wf.id} className="bg-[#12141A] text-slate-100">
                    {wf.name}
                  </option>
                ))}
              </select>

              <Badge
                variant={currentWorkflow.status === "running" ? "accent" : "success"}
                size="sm"
                dot
              >
                {currentWorkflow.status === "running" ? "Running" : "Active"}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {currentWorkflow.description}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<SlidersIcon className="w-3.5 h-3.5" />}
          >
            Graph Settings
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={isTestRunning}
            onClick={handleTriggerTestRun}
            icon={
              isTestRunning ? (
                <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <PlayIcon className="w-3 h-3" />
              )
            }
          >
            {isTestRunning ? "Executing..." : "Test Run"}
          </Button>
        </div>
      </div>

      {/* ── 3-Column Intelligent Workspace ─────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* ── Column 1: Pipeline Steps Tree (3 cols) ──────── */}
        <div className="lg:col-span-3 rounded-xl border border-white/[0.08] bg-[#12141A] flex flex-col min-h-0 overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Pipeline Steps ({currentWorkflow.steps.length})
            </span>
            <button className="text-slate-400 hover:text-slate-200 p-0.5 rounded hover:bg-white/[0.05]">
              <PlusIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {currentWorkflow.steps.map((step, index) => {
              const isSelected = step.id === selectedStepId;
              return (
                <button
                  key={step.id}
                  onClick={() => setSelectedStepId(step.id)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-lg border transition-colors flex items-start gap-2.5",
                    isSelected
                      ? "bg-[#181B24] border-blue-500/40 text-slate-100 shadow-sm"
                      : "bg-transparent border-transparent hover:bg-white/[0.03] text-slate-400 hover:text-slate-200"
                  )}
                >
                  <span className="text-[10px] font-mono text-slate-500 mt-0.5 w-4 shrink-0">
                    0{index + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-medium truncate text-slate-200">
                        {step.name}
                      </span>
                      {getStatusIcon(step.status)}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      {getStepTypeBadge(step.type)}
                      {step.agentAssigned && (
                        <span className="text-[10px] font-mono text-slate-400 truncate">
                          @{step.agentAssigned}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-white/[0.06] text-[11px] font-mono text-slate-500 flex justify-between">
            <span>Trigger: {currentWorkflow.triggerType}</span>
            <span>Reliability: {currentWorkflow.successRate}%</span>
          </div>
        </div>

        {/* ── Column 2: Visual Execution Canvas (5 cols) ───── */}
        <div className="lg:col-span-5 rounded-xl border border-white/[0.08] bg-[#0E1015] flex flex-col min-h-0 overflow-hidden relative">
          <div className="px-3.5 py-2.5 border-b border-white/[0.06] flex items-center justify-between bg-[#12141A]">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <CodeIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>EXECUTION GRAPH CANVAS</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Auto-layout DAG</span>
          </div>

          {/* Canvas Nodes Flow */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-start space-y-4">
            {currentWorkflow.steps.map((step, idx) => {
              const isSelected = step.id === selectedStepId;
              return (
                <React.Fragment key={step.id}>
                  <div
                    onClick={() => setSelectedStepId(step.id)}
                    className={cn(
                      "w-full max-w-md p-3.5 rounded-lg border transition-all cursor-pointer",
                      isSelected
                        ? "bg-[#161922] border-blue-500/60 shadow-md ring-1 ring-blue-500/20"
                        : "bg-[#12141A] border-white/[0.08] hover:border-white/[0.16]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(step.status)}
                        <span className="text-xs font-semibold text-slate-200">
                          {step.name}
                        </span>
                      </div>
                      {getStepTypeBadge(step.type)}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-white/[0.04]">
                      <span>
                        {step.agentAssigned ? `Agent: ${step.agentAssigned}` : `Type: ${step.type}`}
                      </span>
                      {step.durationMs && <span>{step.durationMs}ms</span>}
                    </div>
                  </div>

                  {idx < currentWorkflow.steps.length - 1 && (
                    <div className="flex flex-col items-center justify-center my-0.5">
                      <div className="w-0.5 h-4 bg-white/[0.12]" />
                      <div className="w-2 h-2 rotate-45 border-b border-r border-white/[0.2] -mt-1" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Column 3: Inspector / Reasoning Stream (4 cols) ─ */}
        <div className="lg:col-span-4 rounded-xl border border-white/[0.08] bg-[#12141A] flex flex-col min-h-0 overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <TerminalIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>Inspector & Reasoning</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Live Traces</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
            {selectedStep ? (
              <>
                {/* Node Metadata */}
                <div className="space-y-1.5 pb-3 border-b border-white/[0.06]">
                  <div className="text-[10px] text-slate-500 uppercase">Selected Node</div>
                  <div className="font-semibold text-slate-200 text-sm font-sans">
                    {selectedStep.name}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {getStepTypeBadge(selectedStep.type)}
                    <span className="text-[11px] text-slate-400">
                      Status: <strong className="text-slate-200">{selectedStep.status}</strong>
                    </span>
                  </div>
                </div>

                {/* Node Config JSON */}
                <div className="space-y-1.5">
                  <div className="text-[10px] text-slate-500 uppercase">Step Configuration</div>
                  <div className="p-2.5 rounded bg-[#0A0B0E] border border-white/[0.06] text-slate-300 text-[11px] overflow-x-auto leading-relaxed">
                    <pre>{JSON.stringify(selectedStep.config, null, 2)}</pre>
                  </div>
                </div>

                {/* Agent Reasoning & Logs */}
                <div className="space-y-1.5">
                  <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
                    <span>Execution Stream Logs</span>
                    <span className="text-emerald-400">Synced</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#0A0B0E] border border-white/[0.06] text-slate-300 text-[11px] space-y-1.5 max-h-56 overflow-y-auto">
                    {selectedStep.logs && selectedStep.logs.length > 0 ? (
                      selectedStep.logs.map((log, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-slate-300">
                          <span className="text-slate-600 shrink-0">›</span>
                          <span className="leading-relaxed">{log}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-600 italic">No execution logs yet.</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-slate-500 py-10">Select a step to inspect.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
