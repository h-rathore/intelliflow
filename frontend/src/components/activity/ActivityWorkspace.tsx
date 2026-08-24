"use client";

import React, { useState } from "react";
import {
  ActivityIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  RefreshCwIcon,
  WorkflowsIcon,
  AgentsIcon,
  TerminalIcon,
  FilterIcon,
  SearchIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ActivityItem, ExecutionStatus } from "@/types";
import { cn } from "@/lib/utils";

const SAMPLE_ACTIVITY_STREAM: ActivityItem[] = [
  {
    id: "act-101",
    timestamp: "12:28:42",
    workflowName: "Customer Support Triaging & Dispatch",
    agentName: "SupportRouter-v2",
    action: "Classified incoming ticket #ZD-84920 as BILLING_PAYMENT_FAILURE",
    status: "completed",
    duration: "420ms",
    tokensUsed: 384,
    outputSummary: "Intent confidence 0.984; routed to Tier-2 Billing Escalation pool.",
    details: {
      ticketId: "ZD-84920",
      sentimentScore: -0.72,
      confidence: 0.984,
      escalated: true,
      slaTargetMinutes: 15,
    },
  },
  {
    id: "act-102",
    timestamp: "12:27:10",
    workflowName: "Financial PDF Vector Indexing Pipeline",
    agentName: "DocParser-Alpha",
    action: "Extracting GAAP tables from SEC 10-K report (Page 14/32)",
    status: "running",
    duration: "Running (42s)",
    tokensUsed: 1820,
    outputSummary: "14 tabular financial sheets isolated; executing balance checks.",
  },
  {
    id: "act-103",
    timestamp: "12:15:33",
    workflowName: "Automated PR Code Review & Test Generation",
    agentName: "CodeReviewer-Agent",
    action: "AST scan passed; generated 4 pytest unit tests for PR #492",
    status: "completed",
    duration: "3.8s",
    tokensUsed: 2940,
    outputSummary: "No security vulnerabilities found; posted review comment to GitHub.",
  },
  {
    id: "act-104",
    timestamp: "11:42:01",
    workflowName: "Competitor Pricing Crawler",
    agentName: "ResearchSynthesizer",
    action: "HTTP 429 Rate Limit encountered on target vendor pricing endpoint",
    status: "failed",
    duration: "1.2s",
    tokensUsed: 94,
    outputSummary: "Exponential backoff retry scheduled in 300 seconds.",
    details: {
      httpStatus: 429,
      endpoint: "https://vendor-api.example/pricing",
      retryCount: 2,
    },
  },
  {
    id: "act-105",
    timestamp: "10:30:19",
    workflowName: "System Database Schema Migration",
    agentName: "DatabaseMigration-Agent",
    action: "Executed zero-downtime Alembic migration rev 4f9821a",
    status: "completed",
    duration: "980ms",
    tokensUsed: 420,
    outputSummary: "Added non-blocking foreign key constraint on workflow_executions.",
  },
];

export function ActivityWorkspace() {
  const [activities] = useState<ActivityItem[]>(SAMPLE_ACTIVITY_STREAM);
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "running" | "failed">("all");
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(SAMPLE_ACTIVITY_STREAM[0].id);

  const filteredActivities = activities.filter((act) => {
    if (filterStatus === "all") return true;
    return act.status === filterStatus;
  });

  const getStatusBadge = (status: ExecutionStatus) => {
    switch (status) {
      case "completed":
        return <Badge variant="success" size="sm" dot>Completed</Badge>;
      case "running":
        return <Badge variant="accent" size="sm" dot>Running</Badge>;
      case "failed":
        return <Badge variant="error" size="sm" dot>Failed</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />;
      case "running":
        return <RefreshCwIcon className="w-3.5 h-3.5 text-blue-400 animate-spin" />;
      case "failed":
        return <AlertCircleIcon className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <ClockIcon className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* ── Header & Filter Toolbar ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <ActivityIcon className="w-5 h-5 text-blue-400" />
            <h1 className="text-base font-semibold text-slate-100">
              Execution & Audit Stream
            </h1>
            <span className="text-xs font-mono text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
              Real-time feed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Chronological audit log of multi-agent reasoning traces and workflow node executions.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-[#12141A] p-1 rounded-lg border border-white/[0.08] text-xs">
          {(["all", "running", "completed", "failed"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-2.5 py-1 rounded capitalize transition-colors font-medium text-xs",
                filterStatus === status
                  ? "bg-[#1C202B] text-slate-100 border border-white/[0.08]"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* ── Timeline Execution Stream ────────────────────── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#12141A] divide-y divide-white/[0.06] overflow-hidden">
        {filteredActivities.map((act) => {
          const isExpanded = expandedActivityId === act.id;
          return (
            <div key={act.id} className="transition-colors">
              {/* Row summary */}
              <div
                onClick={() => setExpandedActivityId(isExpanded ? null : act.id)}
                className="p-3.5 hover:bg-[#161821] cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5">{getStatusIcon(act.status)}</div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap font-mono text-[11px]">
                      <span className="text-slate-500">{act.timestamp}</span>
                      <span className="text-slate-600">•</span>
                      <span className="font-semibold text-slate-200">
                        {act.workflowName}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-blue-400">@{act.agentName}</span>
                    </div>

                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {act.action}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center font-mono text-[11px] text-slate-400">
                  {act.tokensUsed && (
                    <span className="text-slate-500 hidden md:inline">
                      {act.tokensUsed} tokens
                    </span>
                  )}
                  <span>{act.duration}</span>
                  {getStatusBadge(act.status)}
                  <ChevronDownIcon
                    className={cn(
                      "w-3.5 h-3.5 text-slate-500 transition-transform",
                      isExpanded && "rotate-180 text-slate-300"
                    )}
                  />
                </div>
              </div>

              {/* Expanded Detail / Inspector Trace */}
              {isExpanded && (
                <div className="px-4 py-3 bg-[#0A0B0E] border-t border-white/[0.04] text-xs font-mono space-y-2.5">
                  <div className="text-[10px] text-slate-500 uppercase">
                    Execution Payload & Structured Result
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {act.outputSummary}
                  </p>

                  {act.details && (
                    <div className="p-2.5 rounded bg-[#12141A] border border-white/[0.06] text-[11px] text-slate-300 overflow-x-auto">
                      <pre>{JSON.stringify(act.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
