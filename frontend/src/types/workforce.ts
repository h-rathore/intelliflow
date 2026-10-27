/**
 * IntelliFlow — Workforce & Execution Types
 */

export type AgentState = "idle" | "thinking" | "planning" | "working" | "waiting" | "completed" | "failed";

export type AgentRole = "planner" | "researcher" | "analyst" | "writer" | "reviewer";

export interface AgentWorkforceMember {
  id: string;
  role: AgentRole;
  name: string;
  codename: string;
  specialty: string;
  state: AgentState;
  stateDescription: string;
  activeTool?: string;
  currentThought?: string;
  outputSnippet?: string;
  progressPercent: number;
  tokensProcessed: number;
  latencyMs: number;
  avatarVariant: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  agentRole: AgentRole;
  agentName: string;
  message: string;
  type: "plan" | "discovery" | "synthesis" | "draft" | "critique" | "system";
  meta?: Record<string, string | number>;
}

export interface TaskSection {
  heading: string;
  content: string;
  contributorRole: AgentRole;
  status: "drafted" | "reviewing" | "verified" | "pending";
}

export interface TaskContextData {
  id: string;
  title: string;
  objective: string;
  status: "in_progress" | "completed" | "paused" | "idle" | "failed";
  activeStage: string;
  elapsedTime: string;
  totalTokens: number;
  confidenceScore: number;
  draftArtifact: {
    title: string;
    sections: TaskSection[];
  };
}

export interface WorkflowStatusResponse {
  id: string;
  title: string;
  objective: string;
  status: "in_progress" | "completed" | "paused" | "idle" | "failed";
  activeStage: string;
  elapsedTime: string;
  totalTokens: number;
  confidenceScore: number;
  draftArtifact: {
    title: string;
    sections: TaskSection[];
  };
  agents?: Record<AgentRole, AgentWorkforceMember>;
  activityEvents?: ActivityEvent[];
}

export interface WorkflowArtifactItem {
  id: string;
  workflowId: string;
  title: string;
  sections: TaskSection[];
  markdownContent: string;
  verifiedStatus: string;
  createdAt: string | null;
}

export interface WorkflowArtifactsResponse {
  workflowId: string;
  artifacts: WorkflowArtifactItem[];
  count: number;
}

export interface WorkflowStageStep {
  stepIndex: number;
  stageName?: string;
  label?: string;
  elapsedTime: string;
  agentStates: Record<AgentRole, {
    state: AgentState;
    stateDescription: string;
    activeTool?: string;
    currentThought?: string;
    outputSnippet?: string;
    progressPercent: number;
  }>;
  newEvents: ActivityEvent[];
  artifactUpdate?: {
    sectionIndex: number;
    content: string;
    status: TaskSection["status"];
  };
}

export type SimulationStep = WorkflowStageStep;
