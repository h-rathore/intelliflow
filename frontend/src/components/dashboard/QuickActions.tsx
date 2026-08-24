"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  WorkflowsIcon,
  AgentsIcon,
  PlusIcon,
  SparklesIcon,
  ZapIcon,
  CheckCircleIcon,
} from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export function QuickActions() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAction = (actionName: string) => {
    setToastMessage(`${actionName} builder will be activated in upcoming phase.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div>
          <div className="flex items-center gap-2">
            <ZapIcon className="w-4 h-4 text-amber-400" />
            <CardTitle>Quick Actions</CardTitle>
          </div>
          <CardDescription>
            Fast-track new orchestrations and autonomous agent configurations.
          </CardDescription>
        </div>
        <Badge variant="info" size="sm">
          Phase 2 Foundation
        </Badge>
      </CardHeader>

      <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Action 1: Create Workflow */}
        <div className="group relative rounded-xl border border-slate-800 bg-slate-900/80 p-4 hover:border-blue-500/40 hover:bg-slate-850/80 transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-105 transition-transform">
                <WorkflowsIcon className="w-5 h-5" />
              </div>
              <Badge variant="info" size="sm">
                Visual Flow
              </Badge>
            </div>
            <h4 className="mt-3 text-sm font-semibold text-slate-100 group-hover:text-blue-300 transition-colors">
              Create Workflow
            </h4>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Design multi-step node graphs connecting data sources, conditional branches, and automated triggers.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Node-based engine</span>
            <Button
              variant="primary"
              size="sm"
              icon={<PlusIcon className="w-3.5 h-3.5" />}
              onClick={() => handleAction("Create Workflow")}
            >
              New Workflow
            </Button>
          </div>
        </div>

        {/* Action 2: Create Agent */}
        <div className="group relative rounded-xl border border-slate-800 bg-slate-900/80 p-4 hover:border-purple-500/40 hover:bg-slate-850/80 transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-105 transition-transform">
                <AgentsIcon className="w-5 h-5" />
              </div>
              <Badge variant="purple" size="sm">
                Autonomous
              </Badge>
            </div>
            <h4 className="mt-3 text-sm font-semibold text-slate-100 group-hover:text-purple-300 transition-colors">
              Create Agent
            </h4>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Configure specialized reasoning agents with custom toolkits, system prompts, and execution boundaries.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Custom capabilities</span>
            <Button
              variant="secondary"
              size="sm"
              icon={<SparklesIcon className="w-3.5 h-3.5 text-purple-400" />}
              onClick={() => handleAction("Create Agent")}
              className="hover:border-purple-500/40"
            >
              New Agent
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Floating feedback toast */}
      {toastMessage && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/95 border border-blue-500/40 text-blue-300 text-xs shadow-2xl backdrop-blur-md animate-fade-in">
          <CheckCircleIcon className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </Card>
  );
}
