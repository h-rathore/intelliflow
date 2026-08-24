"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  ActivityIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  RefreshCwIcon,
  WorkflowsIcon,
  AgentsIcon,
  ChevronRightIcon,
} from "@/components/ui/Icons";
import { ActivityItem, ActivityStatus } from "@/types";
import { cn } from "@/lib/utils";

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    title: "Customer Support Triaging Flow",
    description: "Evaluated incoming tier-1 tickets and dispatched auto-responses.",
    entityType: "workflow",
    entityName: "SupportRouter-v2",
    timestamp: "2 mins ago",
    status: "success",
    duration: "1.4s",
  },
  {
    id: "act-2",
    title: "Data Extraction & Enrichment Agent",
    description: "Parsing weekly PDF reports and indexing vectors into storage.",
    entityType: "agent",
    entityName: "DocParser-Alpha",
    timestamp: "7 mins ago",
    status: "running",
    duration: "In progress",
  },
  {
    id: "act-3",
    title: "Slack Incident Notification Pipeline",
    description: "Triggered alert channel broadcast following webhook threshold event.",
    entityType: "workflow",
    entityName: "OpsAlert-Flow",
    timestamp: "24 mins ago",
    status: "success",
    duration: "420ms",
  },
  {
    id: "act-4",
    title: "Lead Qualification Agent",
    description: "Attempted CRM contact lookup; rate limit encountered on external API.",
    entityType: "agent",
    entityName: "SalesLeadBot",
    timestamp: "1 hour ago",
    status: "failed",
    duration: "3.1s",
  },
  {
    id: "act-5",
    title: "Nightly Analytics Aggregation",
    description: "Scheduled job ready in queue; awaiting scheduled cron trigger window.",
    entityType: "workflow",
    entityName: "DailyMetrics-Job",
    timestamp: "3 hours ago",
    status: "pending",
    duration: "Scheduled",
  },
];

export function RecentActivity() {
  const [filter, setFilter] = useState<"all" | "workflow" | "agent">("all");
  const [activities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);

  const filteredActivities = activities.filter((act) => {
    if (filter === "all") return true;
    return act.entityType === filter;
  });

  const getStatusBadge = (status: ActivityStatus) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="success" size="sm" dot>
            Completed
          </Badge>
        );
      case "running":
        return (
          <Badge variant="info" size="sm" dot>
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
        return (
          <Badge variant="neutral" size="sm">
            Queued
          </Badge>
        );
    }
  };

  const getStatusIcon = (status: ActivityStatus) => {
    switch (status) {
      case "success":
        return <CheckCircleIcon className="w-4 h-4 text-emerald-400" />;
      case "running":
        return <RefreshCwIcon className="w-4 h-4 text-sky-400 animate-spin" />;
      case "failed":
        return <AlertCircleIcon className="w-4 h-4 text-rose-400" />;
      case "pending":
        return <ClockIcon className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-blue-400" />
            <CardTitle>Recent Activity</CardTitle>
          </div>
          <CardDescription>
            Live execution audit stream across workflows and reasoning agents.
          </CardDescription>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950/60 border border-slate-800 self-start sm:self-auto text-xs">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1 rounded-lg font-medium transition-colors",
              filter === "all"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilter("workflow")}
            className={cn(
              "px-3 py-1 rounded-lg font-medium transition-colors",
              filter === "workflow"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Workflows
          </button>
          <button
            onClick={() => setFilter("agent")}
            className={cn(
              "px-3 py-1 rounded-lg font-medium transition-colors",
              filter === "agent"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Agents
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 divide-y divide-slate-800/60">
        {filteredActivities.map((act) => (
          <div
            key={act.id}
            className="p-4 hover:bg-slate-850/40 transition-colors flex items-start justify-between gap-4 group"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 p-2 rounded-xl bg-slate-800/80 border border-slate-750 shrink-0">
                {getStatusIcon(act.status)}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-slate-100 group-hover:text-blue-300 transition-colors truncate">
                    {act.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300 border border-slate-700/60">
                      {act.entityType === "workflow" ? (
                        <WorkflowsIcon className="w-3 h-3 text-blue-400" />
                      ) : (
                        <AgentsIcon className="w-3 h-3 text-purple-400" />
                      )}
                      {act.entityName}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-1 line-clamp-1 leading-relaxed">
                  {act.description}
                </p>

                <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    {act.timestamp}
                  </span>
                  {act.duration && (
                    <>
                      <span>•</span>
                      <span>
                        Latency: <strong className="text-slate-300">{act.duration}</strong>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {getStatusBadge(act.status)}
              <ChevronRightIcon className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all hidden sm:block" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
