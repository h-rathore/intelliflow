"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  AgentRole,
  AgentWorkforceMember,
  ActivityEvent,
  TaskContextData,
} from "@/types/workforce";
import { INITIAL_AGENTS, INITIAL_TASK_CONTEXT } from "@/mock/workforceData";
import { createWorkflow } from "@/lib/api";

interface UseWorkflowRunnerProps {
  customTaskPrompt?: string;
  onComplete?: () => void;
}

const TOTAL_PIPELINE_STAGES = 5;

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
}

function createInFlightAgents(
  baseAgents: Record<AgentRole, AgentWorkforceMember>
): Record<AgentRole, AgentWorkforceMember> {
  return {
    planner: {
      ...baseAgents.planner,
      state: "working",
      stateDescription: "Deconstructing prompt and synthesizing DAG execution plan...",
      progressPercent: 20,
      activeTool: "dag_optimizer",
      currentThought: "Parsing mission requirements and decomposing into agent pipeline...",
      outputSnippet: undefined,
    },
    researcher: {
      ...baseAgents.researcher,
      state: "waiting",
      stateDescription: "Standing by for target research domains from Planner...",
      progressPercent: 0,
      activeTool: undefined,
      currentThought: undefined,
      outputSnippet: undefined,
    },
    analyst: {
      ...baseAgents.analyst,
      state: "waiting",
      stateDescription: "Standing by for quantitative schema and research inputs...",
      progressPercent: 0,
      activeTool: undefined,
      currentThought: undefined,
      outputSnippet: undefined,
    },
    writer: {
      ...baseAgents.writer,
      state: "waiting",
      stateDescription: "Standing by for evidence synthesis and analytical datasets...",
      progressPercent: 0,
      activeTool: undefined,
      currentThought: undefined,
      outputSnippet: undefined,
    },
    reviewer: {
      ...baseAgents.reviewer,
      state: "waiting",
      stateDescription: "Standing by for compiled report and citation audit...",
      progressPercent: 0,
      activeTool: undefined,
      currentThought: undefined,
      outputSnippet: undefined,
    },
  };
}

export function useWorkflowRunner({
  customTaskPrompt,
  onComplete,
}: UseWorkflowRunnerProps = {}) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [agents, setAgents] = useState<Record<AgentRole, AgentWorkforceMember>>(INITIAL_AGENTS);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [taskContext, setTaskContext] = useState<TaskContextData>(INITIAL_TASK_CONTEXT);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedSecondsRef = useRef<number>(0);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  const startTimer = useCallback(() => {
    stopTimer();
    elapsedSecondsRef.current = 0;
    timerRef.current = setInterval(() => {
      elapsedSecondsRef.current += 1;
      const formatted = formatElapsed(elapsedSecondsRef.current);
      setTaskContext((prev) => ({
        ...prev,
        elapsedTime: formatted,
      }));
    }, 1000);
  }, [stopTimer]);

  const startTask = useCallback(
    async (
      promptText: string,
      mode: "autonomous" | "step-by-step" = "autonomous",
      model = "gemini-1.5-flash"
    ) => {
      const activePrompt = promptText || customTaskPrompt || INITIAL_TASK_CONTEXT.title;

      // 1. Initial in-flight state
      setIsRunning(true);
      setCurrentStageIndex(0);

      setTaskContext({
        id: "wf-init",
        title: activePrompt,
        objective: activePrompt,
        status: "in_progress",
        activeStage: "Stage 1: Intent Deconstruction & DAG Planning",
        elapsedTime: "00m 00s",
        totalTokens: 0,
        confidenceScore: 0,
        draftArtifact: {
          title: activePrompt,
          sections: [],
        },
      });

      setAgents(createInFlightAgents(INITIAL_AGENTS));

      setActivityEvents([
        {
          id: `ev-${Date.now()}-init`,
          timestamp: new Date().toLocaleTimeString([], { hour12: false }),
          agentRole: "planner",
          agentName: "Architect (PL-01)",
          message: `Dispatched multi-agent workflow to backend engine: "${activePrompt.slice(0, 60)}..."`,
          type: "plan",
        },
      ]);

      startTimer();

      try {
        // 2. Real backend execution call
        const response = await createWorkflow({
          goalPrompt: activePrompt,
          executionMode: mode,
          model: model,
        });

        stopTimer();

        // 3. Render actual backend response
        setTaskContext({
          id: response.id,
          title: response.title,
          objective: response.objective,
          status: response.status,
          activeStage: response.activeStage || "Mission Completed",
          elapsedTime: response.elapsedTime,
          totalTokens: response.totalTokens,
          confidenceScore: response.confidenceScore,
          draftArtifact: response.draftArtifact,
        });

        if (response.agents) {
          setAgents(response.agents as Record<AgentRole, AgentWorkforceMember>);
        }

        if (response.activityEvents && response.activityEvents.length > 0) {
          setActivityEvents(response.activityEvents);
        }

        setCurrentStageIndex(TOTAL_PIPELINE_STAGES - 1);
        setIsRunning(false);

        if (onComplete) {
          onComplete();
        }
      } catch (err: unknown) {
        stopTimer();
        const errorMessage =
          err instanceof Error ? err.message : "Workflow execution failed";

        setTaskContext((prev) => ({
          ...prev,
          status: "failed",
          activeStage: "Execution Failed",
        }));

        setAgents((prev) => {
          const updated = { ...prev };
          for (const role of Object.keys(updated) as AgentRole[]) {
            if (updated[role].state === "working") {
              updated[role] = {
                ...updated[role],
                state: "failed",
                stateDescription: `Execution interrupted: ${errorMessage}`,
              };
            }
          }
          return updated;
        });

        setActivityEvents((prev) => [
          ...prev,
          {
            id: `ev-${Date.now()}-err`,
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
            agentRole: "reviewer",
            agentName: "System",
            message: `Execution failed: ${errorMessage}`,
            type: "system",
          },
        ]);

        setIsRunning(false);
      }
    },
    [customTaskPrompt, onComplete, startTimer, stopTimer]
  );

  const stepForward = useCallback(() => {
    setCurrentStageIndex((prev) => {
      const nextIdx = Math.min(TOTAL_PIPELINE_STAGES - 1, prev + 1);
      if (nextIdx === TOTAL_PIPELINE_STAGES - 1 && onComplete) {
        onComplete();
      }
      return nextIdx;
    });
  }, [onComplete]);

  const resetTask = useCallback(() => {
    stopTimer();
    setIsRunning(false);
    setCurrentStageIndex(0);
    setAgents(INITIAL_AGENTS);
    setActivityEvents([]);
    setTaskContext(INITIAL_TASK_CONTEXT);
  }, [stopTimer]);

  return {
    isRunning,
    setIsRunning,
    currentStageIndex,
    totalStages: TOTAL_PIPELINE_STAGES,
    agents,
    activityEvents,
    taskContext,
    startTask,
    stepForward,
    resetTask,
  };
}
