"use client";

import React, { useState } from "react";
import {
  AgentsIcon,
  SparklesIcon,
  SearchIcon,
  SlidersIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  RefreshCwIcon,
  CodeIcon,
  DatabaseIcon,
  TerminalIcon,
  PlusIcon,
} from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AgentEntity } from "@/types";
import { cn } from "@/lib/utils";

const INITIAL_AGENTS: AgentEntity[] = [
  {
    id: "agent-1",
    name: "SupportRouter-v2",
    role: "Intent Classifier & Triage Specialist",
    description: "Evaluates raw customer messages, scores urgency sentiment, identifies product modules, and routes tickets to appropriate support queues.",
    model: "claude-3-5-sonnet",
    status: "active",
    tools: ["sentiment_lexicon", "zendesk_api", "crm_lookup", "slack_notifier"],
    totalExecutions: 4820,
    avgLatencyMs: 410,
    successRate: 99.8,
    lastActive: "2 mins ago",
    systemPromptPreview:
      "You are the primary tier-1 triage officer. Analyze customer messages with high semantic precision. Classify issues into: [BILLING, BUG, ONBOARDING, FEATURE_REQ]...",
  },
  {
    id: "agent-2",
    name: "DocParser-Alpha",
    role: "Financial OCR & Schema Validator",
    description: "Extracts tabular statements from complex multi-page PDF documents, normalizes currency units, and executes Python balance equation checks.",
    model: "gpt-4o",
    status: "in_execution",
    tools: ["nougat_ocr", "python_sandbox", "s3_connector", "postgres_writer"],
    totalExecutions: 1940,
    avgLatencyMs: 1250,
    successRate: 98.4,
    lastActive: "Executing now",
    systemPromptPreview:
      "You are a GAAP-compliant financial parsing specialist. Extract all balance sheet tables without hallucinating numerical figures. Ensure balance identities verify...",
  },
  {
    id: "agent-3",
    name: "CodeReviewer-Agent",
    role: "Automated Pull Request Security & Quality Inspector",
    description: "Inspects incoming git diffs, executes AST security linters, drafts regression test fixtures, and generates line-by-line review comments.",
    model: "claude-3-5-sonnet",
    status: "active",
    tools: ["github_api", "ast_parser", "pytest_runner", "semgrep_scanner"],
    totalExecutions: 890,
    avgLatencyMs: 2400,
    successRate: 100,
    lastActive: "28 mins ago",
    systemPromptPreview:
      "You are a principal software engineer performing rigorous code reviews. Look for race conditions, SQL injections, boundary bugs, and missing test coverage...",
  },
  {
    id: "agent-4",
    name: "OpsAlert-Executor",
    role: "System Incident Responder & Telemetry Aggregator",
    description: "Receives Prometheus and Sentry webhook alarms, queries container logs via OpenTelemetry, and composes incident incident briefs.",
    model: "deepseek-r1",
    status: "idle",
    tools: ["prometheus_api", "k8s_client", "datadog_metrics", "pagerduty_api"],
    totalExecutions: 612,
    avgLatencyMs: 820,
    successRate: 99.1,
    lastActive: "1 hour ago",
    systemPromptPreview:
      "You are an on-call site reliability engineer. Rapidly correlate telemetry metrics with recent deployments to identify root-cause anomalies...",
  },
  {
    id: "agent-5",
    name: "ResearchSynthesizer",
    role: "Autonomous Web & ArXiv Deep Intelligence Agent",
    description: "Performs iterative search crawls across web and technical papers, extracts citations, and synthesizes structured markdown reports.",
    model: "claude-3-5-sonnet",
    status: "active",
    tools: ["tavily_search", "arxiv_api", "vector_retriever", "markdown_compiler"],
    totalExecutions: 340,
    avgLatencyMs: 4200,
    successRate: 97.6,
    lastActive: "4 hours ago",
    systemPromptPreview:
      "You are a technical research scientist. Conduct multi-hop search queries to uncover verified citations, methodology comparisons, and benchmark data...",
  },
  {
    id: "agent-6",
    name: "DatabaseMigration-Agent",
    role: "SQL Schema & Data Migration Planner",
    description: "Generates zero-downtime Alembic database migrations, validates foreign key constraints, and creates rollbacks.",
    model: "gpt-4o",
    status: "standby",
    tools: ["sqlalchemy_inspector", "postgres_sandbox", "migration_validator"],
    totalExecutions: 115,
    avgLatencyMs: 980,
    successRate: 100,
    lastActive: "Yesterday",
    systemPromptPreview:
      "You are a database architect specialized in high-throughput PostgreSQL. Plan non-blocking schema alterations...",
  },
];

export function AgentsWorkspace() {
  const [agents, setAgents] = useState<AgentEntity[]>(INITIAL_AGENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>(INITIAL_AGENTS[0].id);

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tools.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedAgent =
    agents.find((a) => a.id === selectedAgentId) || agents[0];

  const getStatusBadge = (status: AgentEntity["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="success" size="sm" dot>Active</Badge>;
      case "in_execution":
        return <Badge variant="accent" size="sm" dot>In Execution</Badge>;
      case "idle":
        return <Badge variant="neutral" size="sm">Idle</Badge>;
      case "standby":
        return <Badge variant="warning" size="sm">Standby</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] space-y-4">
      {/* ── Header & Search ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <AgentsIcon className="w-5 h-5 text-blue-400" />
            <h1 className="text-base font-semibold text-slate-100">
              Autonomous Agents Fleet
            </h1>
            <span className="text-xs font-mono text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
              {agents.length} Entities
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            System entities configured with specialized directives, reasoning engines, and tool bindings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <SearchIcon className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by agent name or tool..."
              className="bg-[#12141A] text-xs text-slate-200 placeholder:text-slate-500 border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500/50 w-64"
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={<PlusIcon className="w-3.5 h-3.5" />}
          >
            Register Agent
          </Button>
        </div>
      </div>

      {/* ── Main Fleet Layout: Table List & Inspector ──────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Left / Table Area (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-white/[0.08] bg-[#12141A] flex flex-col min-h-0 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/[0.06] text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
            <span>Agent System Directory</span>
            <span>{filteredAgents.length} matching</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05]">
            {filteredAgents.map((agent) => {
              const isSelected = agent.id === selectedAgentId;
              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={cn(
                    "p-3.5 transition-colors cursor-pointer text-left space-y-2",
                    isSelected
                      ? "bg-[#181B24] border-l-2 border-l-blue-500"
                      : "hover:bg-[#151720] border-l-2 border-l-transparent"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-xs text-slate-100 truncate">
                        {agent.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-1.5 py-0.2 rounded border border-white/[0.05]">
                        {agent.model}
                      </span>
                    </div>
                    {getStatusBadge(agent.status)}
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-1">
                    {agent.role}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono text-slate-500">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {agent.tools.slice(0, 3).map((tool) => (
                        <span
                          key={tool}
                          className="px-1.5 py-0.2 rounded bg-[#0A0B0E] border border-white/[0.04] text-[10px] text-slate-400"
                        >
                          {tool}
                        </span>
                      ))}
                      {agent.tools.length > 3 && (
                        <span className="text-[10px] text-slate-500">
                          +{agent.tools.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span>{agent.totalExecutions.toLocaleString()} runs</span>
                      <span>{agent.avgLatencyMs}ms</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right / Detailed Agent Inspector (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-white/[0.08] bg-[#12141A] flex flex-col min-h-0 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              Agent Specifications & Tools
            </span>
            <Badge variant="accent" size="sm">
              {selectedAgent.model}
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
            {/* Name & Role */}
            <div className="space-y-1 pb-3 border-b border-white/[0.06]">
              <div className="text-[10px] text-slate-500 uppercase">Entity Identity</div>
              <h3 className="text-sm font-semibold text-slate-100 font-sans">
                {selectedAgent.name}
              </h3>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                {selectedAgent.description}
              </p>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-2 pb-3 border-b border-white/[0.06]">
              <div className="p-2 rounded bg-[#0A0B0E] border border-white/[0.06] text-center">
                <span className="text-[10px] text-slate-500 uppercase block">Total Runs</span>
                <span className="text-xs font-semibold text-slate-200">
                  {selectedAgent.totalExecutions}
                </span>
              </div>
              <div className="p-2 rounded bg-[#0A0B0E] border border-white/[0.06] text-center">
                <span className="text-[10px] text-slate-500 uppercase block">Avg Latency</span>
                <span className="text-xs font-semibold text-slate-200">
                  {selectedAgent.avgLatencyMs}ms
                </span>
              </div>
              <div className="p-2 rounded bg-[#0A0B0E] border border-white/[0.06] text-center">
                <span className="text-[10px] text-slate-500 uppercase block">Success Rate</span>
                <span className="text-xs font-semibold text-emerald-400">
                  {selectedAgent.successRate}%
                </span>
              </div>
            </div>

            {/* Tool Bindings */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-slate-500 uppercase">Attached Tool Capabilities</div>
              <div className="grid grid-cols-2 gap-1.5">
                {selectedAgent.tools.map((tool) => (
                  <div
                    key={tool}
                    className="p-2 rounded bg-[#0A0B0E] border border-white/[0.06] flex items-center gap-1.5 text-slate-300 text-[11px]"
                  >
                    <CodeIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{tool}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* System Prompt Template */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-slate-500 uppercase">System Prompt Directive</div>
              <div className="p-3 rounded bg-[#0A0B0E] border border-white/[0.06] text-slate-300 text-[11px] leading-relaxed max-h-48 overflow-y-auto font-sans">
                {selectedAgent.systemPromptPreview}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
