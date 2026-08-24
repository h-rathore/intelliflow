/**
 * IntelliFlow — Core TypeScript Types & Interfaces
 */

export * from "./workforce";

/** Generic API response envelope */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/** API error shape returned by the backend */
export interface ApiError {
  detail: string;
  status_code?: number;
}

/** Health check response from GET /api/v1/health */
export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
}

/** Navigation item for sidebar */
export type ViewTab = "workspace" | "workflows" | "agents" | "activity" | "settings" | "dashboard";

export interface NavItem {
  id: ViewTab;
  label: string;
  href: string;
  icon: string;
  badge?: string;
  count?: number;
  disabled?: boolean;
}

/** Status for executions, agents, and nodes */
export type ExecutionStatus = "idle" | "running" | "completed" | "failed" | "pending" | "paused" | "success";
export type ActivityStatus = ExecutionStatus;

/** Agent System Entity */
export interface AgentEntity {
  id: string;
  name: string;
  role: string;
  description: string;
  model: string;
  status: "active" | "idle" | "in_execution" | "standby";
  tools: string[];
  totalExecutions: number;
  avgLatencyMs: number;
  successRate: number;
  lastActive: string;
  systemPromptPreview?: string;
}

/** Workflow Step / Node */
export interface WorkflowStep {
  id: string;
  name: string;
  type: "trigger" | "agent" | "transform" | "condition" | "action" | "output";
  agentAssigned?: string;
  status: ExecutionStatus;
  config: Record<string, string | number | boolean>;
  durationMs?: number;
  logs?: string[];
}

/** Workflow Definition & Execution */
export interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  status: ExecutionStatus;
  stepsCount: number;
  steps: WorkflowStep[];
  primaryAgent: string;
  lastRunAt: string;
  duration?: string;
  triggerType: "webhook" | "cron" | "manual" | "event";
  successRate: number;
}

/** Legacy / Dashboard Activity Item */
export interface ActivityItem {
  id: string;
  timestamp: string;
  workflowId?: string;
  workflowName?: string;
  agentId?: string;
  agentName?: string;
  action?: string;
  status: ExecutionStatus;
  duration?: string;
  tokensUsed?: number;
  outputSummary?: string;
  details?: Record<string, unknown>;
  title?: string;
  description?: string;
  entityType?: "workflow" | "agent" | "system";
  entityName?: string;
}

/** Legacy / Dashboard Metric */
export interface StatMetric {
  id: string;
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  description: string;
  iconName: "workflow" | "agent" | "task" | "rate";
  accentColor: "blue" | "purple" | "emerald" | "amber";
}

/** Quick Action descriptor */
export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  icon: "create-workflow" | "create-agent";
  primaryActionLabel: string;
  badgeText?: string;
}

/** Command Execution State */
export interface CommandRunRequest {
  prompt: string;
  model: string;
  mode: "autonomous" | "step-by-step";
  targetAgent?: string;
}
