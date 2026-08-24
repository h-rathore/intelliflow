import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import {
  WorkflowsIcon,
  AgentsIcon,
  TaskListIcon,
  PercentIcon,
  TrendingUpIcon,
} from "@/components/ui/Icons";
import { StatMetric } from "@/types";
import { cn } from "@/lib/utils";

interface StatCardProps {
  metric: StatMetric;
  className?: string;
}

export function StatCard({ metric, className }: StatCardProps) {
  const getIcon = () => {
    switch (metric.iconName) {
      case "workflow":
        return <WorkflowsIcon className="w-5 h-5" />;
      case "agent":
        return <AgentsIcon className="w-5 h-5" />;
      case "task":
        return <TaskListIcon className="w-5 h-5" />;
      case "rate":
        return <PercentIcon className="w-5 h-5" />;
    }
  };

  const accentStyles = {
    blue: {
      iconBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      glow: "blue" as const,
      highlight: "text-blue-400",
      badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    purple: {
      iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      glow: "purple" as const,
      highlight: "text-purple-400",
      badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    emerald: {
      iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      glow: "emerald" as const,
      highlight: "text-emerald-400",
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    amber: {
      iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      glow: "none" as const,
      highlight: "text-amber-400",
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
  };

  const theme = accentStyles[metric.accentColor];

  return (
    <Card hoverEffect glow={theme.glow} className={cn("relative overflow-hidden", className)}>
      {/* Subtle background glow effect */}
      <div
        className={cn(
          "absolute -right-8 -top-8 w-28 h-28 rounded-full blur-3xl opacity-20 pointer-events-none",
          metric.accentColor === "blue" && "bg-blue-500",
          metric.accentColor === "purple" && "bg-purple-500",
          metric.accentColor === "emerald" && "bg-emerald-500",
          metric.accentColor === "amber" && "bg-amber-500"
        )}
      />

      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {metric.title}
          </span>
          <div className={cn("p-2.5 rounded-xl border", theme.iconBg)}>
            {getIcon()}
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div className="text-3xl font-bold tracking-tight text-white">
            {metric.value}
          </div>

          {metric.change && (
            <div
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border",
                metric.trend === "up"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              )}
            >
              <TrendingUpIcon className="w-3 h-3" />
              <span>{metric.change}</span>
            </div>
          )}
        </div>

        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
          {metric.description}
        </p>
      </CardContent>
    </Card>
  );
}
