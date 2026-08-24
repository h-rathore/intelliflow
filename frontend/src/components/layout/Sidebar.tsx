"use client";

import React, { useState } from "react";
import {
  DashboardIcon,
  WorkflowsIcon,
  AgentsIcon,
  ActivityIcon,
  SettingsIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
} from "@/components/ui/Icons";
import { BackendStatus } from "@/components/dashboard/BackendStatus";
import { NavItem, ViewTab } from "@/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
  activeId: ViewTab;
  onNavigate: (id: ViewTab) => void;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Command",
    href: "#dashboard",
    icon: "dashboard",
  },
  {
    id: "workflows",
    label: "Workflows",
    href: "#workflows",
    icon: "workflows",
    count: 4,
  },
  {
    id: "agents",
    label: "Agents Fleet",
    href: "#agents",
    icon: "agents",
    count: 6,
  },
  {
    id: "activity",
    label: "Activity Log",
    href: "#activity",
    icon: "activity",
  },
  {
    id: "settings",
    label: "Settings",
    href: "#settings",
    icon: "settings",
  },
];

function BrandMark({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center shrink-0 bg-signal text-cream font-display font-semibold leading-none",
        collapsed ? "w-8 h-8 text-sm" : "w-9 h-9 text-base"
      )}
      aria-hidden
    >
      IF
    </div>
  );
}

export function Sidebar({
  className,
  activeId,
  onNavigate,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const getNavIcon = (iconName: string, isActive: boolean) => {
    const iconClass = cn(
      "w-4 h-4 shrink-0 transition-colors duration-150",
      isActive ? "text-signal" : "text-cream-muted group-hover:text-cream"
    );

    switch (iconName) {
      case "dashboard":
        return <DashboardIcon className={iconClass} />;
      case "workflows":
        return <WorkflowsIcon className={iconClass} />;
      case "agents":
        return <AgentsIcon className={iconClass} />;
      case "activity":
        return <ActivityIcon className={iconClass} />;
      case "settings":
        return <SettingsIcon className={iconClass} />;
      default:
        return <DashboardIcon className={iconClass} />;
    }
  };

  return (
    <aside
      className={cn(
        "shrink-0 flex flex-col justify-between bg-ink text-cream border-r border-ink select-none transition-[width] duration-200 ease-studio",
        collapsed ? "w-[72px]" : "w-[248px]",
        className
      )}
    >
      <div>
        <div
          className={cn(
            "flex items-start gap-3 border-b border-cream/10",
            collapsed ? "flex-col items-center px-2 py-4" : "px-4 py-5"
          )}
        >
          <BrandMark collapsed={collapsed} />

          {!collapsed && (
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="font-display text-[1.35rem] leading-[0.95] tracking-tight text-cream">
                IntelliFlow
              </p>
              <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-cream-muted">
                Agent studio
              </p>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "p-1 text-cream-muted hover:text-cream hover:bg-cream/10 transition-colors duration-150",
              collapsed ? "mt-1" : "ml-auto -mr-1"
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpenIcon className="w-3.5 h-3.5" />
            ) : (
              <PanelLeftCloseIcon className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className={cn(collapsed ? "px-2 py-3" : "px-3 py-4")}>
          {!collapsed && (
            <p className="px-2 pb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-cream-muted">
              Floor index
            </p>
          )}

          <nav className="flex flex-col">
            {NAV_ITEMS.map((item, index) => {
              const isActive = activeId === item.id;
              const ordinal = String(index + 1).padStart(2, "0");
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group relative w-full flex items-center text-left transition-colors duration-150",
                    collapsed ? "justify-center py-3" : "gap-3 px-2 py-2.5",
                    isActive
                      ? "text-cream"
                      : "text-cream-muted hover:text-cream"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-signal" />
                  )}

                  {!collapsed && (
                    <span className="w-5 font-mono text-[10px] text-cream-muted/80">
                      {ordinal}
                    </span>
                  )}

                  {getNavIcon(item.icon, isActive)}

                  {!collapsed && (
                    <div className="flex items-baseline justify-between w-full min-w-0 gap-2">
                      <span className="truncate text-[13px] font-medium tracking-tight">
                        {item.label}
                      </span>
                      {item.count !== undefined && (
                        <span className="font-mono text-[10px] text-cream-muted">
                          {item.count}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className={cn("border-t border-cream/10", collapsed ? "px-2 py-2" : "p-3")}>
        {!collapsed && (
          <p className="px-1 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-cream-muted">
            Uplink
          </p>
        )}
        {collapsed ? (
          <BackendStatus density="rail" tone="ink" />
        ) : (
          <BackendStatus tone="ink" />
        )}
      </div>
    </aside>
  );
}
