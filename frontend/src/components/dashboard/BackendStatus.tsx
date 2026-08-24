"use client";

import React, { useEffect, useState, useCallback } from "react";
import { fetchHealthStatus } from "@/lib/api";
import { HealthResponse } from "@/types";
import { RefreshCwIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

interface BackendStatusProps {
  className?: string;
  compact?: boolean;
  /** Visual surface: paper chrome vs ink sidebar vs collapsed rail. */
  tone?: "paper" | "ink";
  density?: "default" | "rail";
}

export function BackendStatus({
  className,
  compact = false,
  tone = "paper",
  density = "default",
}: BackendStatusProps) {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const checkStatus = useCallback(async () => {
    setIsRefreshing(true);
    const result = await fetchHealthStatus(3500);
    setLatency(result.latencyMs);
    setLastChecked(new Date());

    if (result.ok && result.data) {
      setStatus("online");
      setHealthData(result.data);
    } else {
      setStatus("offline");
      setHealthData(null);
    }
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const statusLabel =
    status === "online"
      ? "Engine live"
      : status === "checking"
        ? "Checking"
        : "Engine down";

  const markClass =
    status === "online"
      ? "bg-role-analyst"
      : status === "checking"
        ? "bg-role-researcher if-pulse"
        : "bg-signal";

  if (density === "rail") {
    return (
      <button
        type="button"
        onClick={checkStatus}
        title={`Backend ${statusLabel}${latency !== null ? ` · ${latency}ms` : ""} · http://127.0.0.1:8000${lastChecked ? ` · ${lastChecked.toLocaleTimeString()}` : ""}`}
        className={cn(
          "flex items-center justify-center w-full py-2 text-cream-muted hover:text-cream",
          className
        )}
      >
        <span className={cn("w-2 h-2 shrink-0", markClass)} />
      </button>
    );
  }

  if (compact) {
    const onPaper = tone === "paper";
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 px-2 py-1 border text-[11px] font-mono",
          onPaper
            ? "border-ink/15 bg-cream text-ink"
            : "border-cream/15 bg-transparent text-cream",
          className
        )}
      >
        <span className={cn("w-1.5 h-1.5 shrink-0", markClass)} />
        <span className={cn("font-sans font-medium tracking-tight", onPaper ? "text-ink" : "text-cream")}>
          {statusLabel}
        </span>
        {status === "online" && latency !== null && (
          <span
            className={cn(
              "border-l pl-1.5 text-[10px]",
              onPaper ? "border-ink/15 text-ink-muted" : "border-cream/15 text-cream-muted"
            )}
          >
            {latency}ms
          </span>
        )}
      </div>
    );
  }

  const onInk = tone === "ink";

  return (
    <div
      className={cn(
        "border p-3 text-xs",
        onInk
          ? "border-cream/15 bg-transparent text-cream"
          : "border-ink/15 bg-cream text-ink",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("w-2 h-2 shrink-0", markClass)} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={cn("font-medium truncate", onInk ? "text-cream" : "text-ink")}>
                FastAPI Engine
              </span>
              <span className={cn("text-[10px] font-mono", onInk ? "text-cream-muted" : "text-ink-muted")}>
                :8000
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={checkStatus}
          disabled={isRefreshing}
          title="Refresh backend status"
          className={cn(
            "p-1 transition-colors duration-150 disabled:opacity-40",
            onInk
              ? "text-cream-muted hover:text-cream hover:bg-cream/10"
              : "text-ink-muted hover:text-ink hover:bg-ink/5"
          )}
        >
          <RefreshCwIcon
            className={cn("w-3 h-3", isRefreshing && "animate-spin text-signal")}
          />
        </button>
      </div>

      {status === "online" && healthData && (
        <div
          className={cn(
            "mt-2 pt-2 border-t flex items-center justify-between text-[11px] font-mono",
            onInk ? "border-cream/10 text-cream-muted" : "border-ink/10 text-ink-muted"
          )}
        >
          <span>v{healthData.version}</span>
          <span className={onInk ? "text-cream" : "text-ink"}>{latency}ms</span>
          <span className="capitalize">{healthData.environment}</span>
        </div>
      )}

      {status === "offline" && (
        <div
          className={cn(
            "mt-2 pt-2 border-t text-[10px] font-mono text-signal",
            onInk ? "border-cream/10" : "border-ink/10"
          )}
        >
          FastAPI not responding on :8000
        </div>
      )}
    </div>
  );
}
