"use client";

import React from "react";
import { BackendStatus } from "@/components/dashboard/BackendStatus";
import { PlusIcon, SearchIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { ViewTab } from "@/types";
import { cn } from "@/lib/utils";

interface NavbarProps {
  className?: string;
  activeTab: ViewTab;
  onNewWorkflow?: () => void;
  onOpenCommandPalette?: () => void;
}

export function Navbar({
  className,
  activeTab,
  onNewWorkflow,
  onOpenCommandPalette,
}: NavbarProps) {
  const getTabLabel = (tab: ViewTab) => {
    switch (tab) {
      case "dashboard":
        return "Command Workspace";
      case "workflows":
        return "Workflow Pipeline Engine";
      case "agents":
        return "Autonomous Agents Fleet";
      case "activity":
        return "Execution & Audit Stream";
      case "settings":
        return "System & API Configuration";
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-12 w-full items-center justify-between border-b border-ink/15 bg-canvas px-4",
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
          workspace
        </span>
        <span className="text-ink/25" aria-hidden>
          /
        </span>
        <span className="truncate text-sm font-medium text-ink tracking-tight">
          {getTabLabel(activeTab)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1 border border-ink/15 bg-cream text-xs text-ink-muted hover:text-ink hover:border-ink/30 transition-colors duration-150"
        >
          <SearchIcon className="w-3.5 h-3.5" />
          <span>Quick find</span>
          <kbd className="font-mono text-[10px] text-ink-muted border border-ink/15 px-1.5 py-0.5">
            ⌘K
          </kbd>
        </button>

        <BackendStatus compact tone="paper" />

        <Button
          variant="primary"
          size="sm"
          icon={<PlusIcon className="w-3.5 h-3.5" />}
          onClick={onNewWorkflow}
        >
          <span>New Workflow</span>
        </Button>
      </div>
    </header>
  );
}
