"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { CommandWorkspace } from "@/components/command/CommandWorkspace";
import { WorkflowWorkspace } from "@/components/workflows/WorkflowWorkspace";
import { AgentsWorkspace } from "@/components/agents/AgentsWorkspace";
import { ActivityWorkspace } from "@/components/activity/ActivityWorkspace";
import { SettingsWorkspace } from "@/components/settings/SettingsWorkspace";
import { ViewTab } from "@/types";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ViewTab>("workspace");
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Sync with window hash if present
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "") as ViewTab;
      if (["workspace", "workflows", "agents", "activity", "settings", "dashboard"].includes(hash)) {
        setActiveTab(hash === "dashboard" ? "workspace" : hash);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleNavigate = (tab: ViewTab) => {
    setActiveTab(tab);
    window.location.hash = tab === "workspace" ? "workspace" : tab;
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case "workspace":
      case "dashboard":
        return <CommandWorkspace />;
      case "workflows":
        return <WorkflowWorkspace />;
      case "agents":
        return <AgentsWorkspace />;
      case "activity":
        return <ActivityWorkspace />;
      case "settings":
        return <SettingsWorkspace />;
      default:
        return <CommandWorkspace />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-ink antialiased font-sans">
      {/* ── Minimal Left Sidebar ─────────────────────────── */}
      <Sidebar activeId={activeTab === "workspace" ? "dashboard" : activeTab} onNavigate={handleNavigate} />

      {/* ── Main View Area ───────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab === "workspace" ? "dashboard" : activeTab}
          onNewWorkflow={() => handleNavigate("workspace")}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
        />

        {/* Scrollable Active Workspace Canvas */}
        <main className="flex-1 overflow-hidden bg-canvas p-3 sm:p-4">
          <div className="if-well h-full overflow-y-auto border border-ink/15 bg-well text-cream p-4 sm:p-6 lg:p-8">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
}
