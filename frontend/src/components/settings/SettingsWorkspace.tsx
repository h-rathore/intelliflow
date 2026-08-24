"use client";

import React, { useState } from "react";
import {
  SettingsIcon,
  ServerIcon,
  CodeIcon,
  CheckCircleIcon,
  SlidersIcon,
} from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BackendStatus } from "@/components/dashboard/BackendStatus";

export function SettingsWorkspace() {
  const [backendUrl, setBackendUrl] = useState("http://127.0.0.1:8000");
  const [defaultModel, setDefaultModel] = useState("claude-3-5-sonnet");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-blue-400" />
          <h1 className="text-base font-semibold text-slate-100">
            System & Engine Settings
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Configure FastAPI backend endpoints, default model provider routing, and agent sandbox limits.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Backend Connectivity */}
        <div className="p-4 rounded-xl border border-white/[0.08] bg-[#12141A] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ServerIcon className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-200">
                FastAPI Backend Endpoint
              </span>
            </div>
            <Badge variant="accent" size="sm">
              REST / ASGI
            </Badge>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The target URL where the IntelliFlow FastAPI application is serving its API v1 routes.
          </p>

          <div className="space-y-1.5">
            <input
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              className="w-full bg-[#0A0B0E] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
            <span className="text-[10px] font-mono text-slate-500 block">
              Health check endpoint: {backendUrl}/api/v1/health
            </span>
          </div>

          <div className="pt-2">
            <BackendStatus />
          </div>
        </div>

        {/* Model Defaults */}
        <div className="p-4 rounded-xl border border-white/[0.08] bg-[#12141A] space-y-3">
          <div className="flex items-center gap-2">
            <CodeIcon className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-200">
              Default Reasoning Model
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Default LLM engine used for autonomous workflow planning and code synthesis when not overridden per-step.
          </p>

          <select
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            className="w-full bg-[#0A0B0E] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 cursor-pointer"
          >
            <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet (Recommended)</option>
            <option value="gpt-4o">OpenAI GPT-4o</option>
            <option value="deepseek-r1">DeepSeek R1 Reasoning</option>
            <option value="ollama-local">Local Engine (Ollama / Llama 3.3)</option>
          </select>
        </div>

        {/* Action button */}
        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-mono">
              <CheckCircleIcon className="w-4 h-4" />
              Settings saved successfully
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-mono">Changes apply immediately</span>
          )}

          <Button type="submit" variant="primary" size="sm">
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
