"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  AgentRole,
  AgentWorkforceMember,
  ActivityEvent,
  TaskContextData,
  WorkflowStageStep,
} from "@/types/workforce";
import { INITIAL_AGENTS, INITIAL_TASK_CONTEXT } from "@/mock/workforceData";

interface UseWorkflowRunnerProps {
  customTaskPrompt?: string;
  onComplete?: () => void;
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

  // Dynamic simulation stages generator based on the active prompt
  const generateStages = useCallback((promptText: string): WorkflowStageStep[] => {
    const taskTitle = promptText || INITIAL_TASK_CONTEXT.title;

    return [
      {
        stepIndex: 0,
        stageName: "Stage 1: Intent Deconstruction & DAG Planning",
        elapsedTime: "00m 45s",
        agentStates: {
          planner: {
            state: "thinking",
            stateDescription: "Synthesizing execution graph & identifying required tool pipelines",
            activeTool: "dag_optimizer",
            currentThought: `Deconstructing prompt: "${taskTitle.slice(0, 60)}..." into parallel sub-tasks.`,
            outputSnippet: "Isolated 4 required sub-tasks: Domain discovery, metric correlation, compilation, verification.",
            progressPercent: 45,
          },
          researcher: {
            state: "waiting",
            stateDescription: "Standing by for target domain list from Architect",
            progressPercent: 0,
          },
          analyst: {
            state: "waiting",
            stateDescription: "Standing by for quantitative schema from Architect",
            progressPercent: 0,
          },
          writer: {
            state: "waiting",
            stateDescription: "Standing by for research datasets",
            progressPercent: 0,
          },
          reviewer: {
            state: "waiting",
            stateDescription: "Standing by for draft compilation",
            progressPercent: 0,
          },
        },
        newEvents: [
          {
            id: `ev-init-1`,
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
            agentRole: "planner",
            agentName: "Architect (PL-01)",
            message: `Deconstructing mission: "${taskTitle.slice(0, 60)}..."`,
            type: "plan",
          },
        ],
      },
      {
        stepIndex: 1,
        stageName: "Stage 2: Parallel Discovery & Quantitative Analysis",
        elapsedTime: "02m 30s",
        agentStates: {
          planner: {
            state: "completed",
            stateDescription: "Execution plan validated and dispatched to worker nodes",
            activeTool: "dag_optimizer",
            outputSnippet: "Dispatched parallel crawl triggers to Scout and Synthesizer.",
            progressPercent: 100,
          },
          researcher: {
            state: "working",
            stateDescription: "Crawling whitepapers, product documentation & market filings",
            activeTool: "deep_web_crawler",
            currentThought: "Ingesting Q3 2025 release notes and enterprise pricing tiers across target entities.",
            outputSnippet: "Discovered 18 verified sources; parsed pricing tables and ARR benchmarks.",
            progressPercent: 72,
          },
          analyst: {
            state: "working",
            stateDescription: "Cross-correlating company market caps, moat strength, and autonomy scores",
            activeTool: "python_matrix_repl",
            currentThought: "Computing competitive positioning index: UI-based vs. API-first orchestration.",
            outputSnippet: "Matrix parsed: 4 leaders identified, 6 challengers, 4 niche vertical AI platforms.",
            progressPercent: 60,
          },
          writer: {
            state: "waiting",
            stateDescription: "Waiting for Scout & Synthesizer to complete benchmark datasets",
            progressPercent: 0,
          },
          reviewer: {
            state: "waiting",
            stateDescription: "Standing by for draft compilation",
            progressPercent: 0,
          },
        },
        newEvents: [
          {
            id: `ev-stage2-1`,
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
            agentRole: "planner",
            agentName: "Architect (PL-01)",
            message: "Dispatched concurrent workflows to Scout (Research) and Synthesizer (Analytics)",
            type: "plan",
          },
          {
            id: `ev-stage2-2`,
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
            agentRole: "researcher",
            agentName: "Scout (RS-02)",
            message: "Discovered 18 primary sources, pricing tables, and API documentation",
            type: "discovery",
          },
          {
            id: `ev-stage2-3`,
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
            agentRole: "analyst",
            agentName: "Synthesizer (AN-03)",
            message: "Generated comparative matrix comparing latency, throughput, and moat strength",
            type: "synthesis",
          },
        ],
      },
      {
        stepIndex: 2,
        stageName: "Stage 3: Document Compilation & Section Synthesis",
        elapsedTime: "04m 45s",
        agentStates: {
          planner: { state: "completed", stateDescription: "Plan complete", progressPercent: 100 },
          researcher: {
            state: "completed",
            stateDescription: "Completed data discovery (24 sources ingested)",
            outputSnippet: "Finalized feature dataset & benchmark references.",
            progressPercent: 100,
          },
          analyst: {
            state: "completed",
            stateDescription: "Completed capability matrix & quantitative scoring",
            outputSnippet: "Scored 14 platforms across 6 architectural dimensions.",
            progressPercent: 100,
          },
          writer: {
            state: "working",
            stateDescription: "Compiling structured briefing and executive summary",
            activeTool: "markdown_compiler",
            currentThought: "Synthesizing Section 3 & 4 with embedded comparison tables and citations.",
            outputSnippet: "Generated 2,400 words of structured analysis across 4 key dimensions.",
            progressPercent: 85,
          },
          reviewer: {
            state: "waiting",
            stateDescription: "Standing by for draft compilation from Scribe",
            progressPercent: 20,
          },
        },
        newEvents: [
          {
            id: `ev-stage3-1`,
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
            agentRole: "writer",
            agentName: "Scribe (WR-04)",
            message: "Ingested verified datasets from Scout & Synthesizer; compiled Sections 1-4",
            type: "draft",
          },
        ],
      },
      {
        stepIndex: 3,
        stageName: "Stage 4: Fact Verification & Citation Certification",
        elapsedTime: "06m 15s",
        agentStates: {
          planner: { state: "completed", stateDescription: "Plan complete", progressPercent: 100 },
          researcher: { state: "completed", stateDescription: "Research complete", progressPercent: 100 },
          analyst: { state: "completed", stateDescription: "Analysis complete", progressPercent: 100 },
          writer: {
            state: "completed",
            stateDescription: "Draft compiled (3,200 words, 4 tables)",
            outputSnippet: "Transmitted full draft to Validator for verification.",
            progressPercent: 100,
          },
          reviewer: {
            state: "completed",
            stateDescription: "Verification passed (100% verified citations, zero hallucinations)",
            activeTool: "fact_checker",
            outputSnippet: "Approved final briefing. Certified ready for production export.",
            progressPercent: 100,
          },
        },
        newEvents: [
          {
            id: `ev-stage4-1`,
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
            agentRole: "reviewer",
            agentName: "Validator (RV-05)",
            message: "Audit complete: 28/28 citations verified. Zero hallucinations detected. Document certified",
            type: "critique",
          },
          {
            id: `ev-stage4-2`,
            timestamp: new Date().toLocaleTimeString([], { hour12: false }),
            agentRole: "planner",
            agentName: "Architect (PL-01)",
            message: "Mission completed successfully across 5 collaborative agents",
            type: "system",
          },
        ],
      },
    ];
  }, []);

  const stagesRef = useRef<WorkflowStageStep[]>(generateStages(customTaskPrompt || ""));

  // Initialize or start task
  const startTask = useCallback((promptText: string) => {
    const newStages = generateStages(promptText);
    stagesRef.current = newStages;

    setTaskContext({
      id: `task-${Date.now()}`,
      title: promptText,
      objective: `Execute collaborative multi-agent workflow: "${promptText}". Synthesize verified outputs across Planner, Researcher, Analyst, Writer, and Reviewer.`,
      status: "in_progress",
      activeStage: newStages[0].stageName || newStages[0].label || "Stage 1",
      elapsedTime: "00m 01s",
      totalTokens: 1450,
      confidenceScore: 99.2,
      draftArtifact: INITIAL_TASK_CONTEXT.draftArtifact,
    });

    setCurrentStageIndex(0);
    applyStage(0, newStages);
    setIsRunning(true);
  }, [generateStages]);

  const applyStage = (stageIdx: number, stagesList = stagesRef.current) => {
    const stage = stagesList[stageIdx];
    if (!stage) return;

    setAgents((prev) => {
      const next = { ...prev };
      (Object.keys(stage.agentStates) as AgentRole[]).forEach((role) => {
        const stateUpdate = stage.agentStates[role];
        next[role] = {
          ...next[role],
          ...stateUpdate,
        };
      });
      return next;
    });

    if (stage.newEvents && stage.newEvents.length > 0) {
      setActivityEvents((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const toAdd = stage.newEvents.filter((e) => !existingIds.has(e.id));
        return [...prev, ...toAdd];
      });
    }

    setTaskContext((prev) => ({
      ...prev,
      elapsedTime: stage.elapsedTime,
      status: stageIdx >= stagesList.length - 1 ? "completed" : "in_progress",
      activeStage: stage.stageName || stage.label || prev.activeStage,
      totalTokens: (stageIdx + 1) * 3400,
    }));
  };

  const stepForward = useCallback(() => {
    const maxIdx = stagesRef.current.length - 1;
    if (currentStageIndex < maxIdx) {
      const nextIdx = currentStageIndex + 1;
      setCurrentStageIndex(nextIdx);
      applyStage(nextIdx);
      if (nextIdx === maxIdx && onComplete) {
        onComplete();
      }
    } else {
      setIsRunning(false);
    }
  }, [currentStageIndex, onComplete]);

  const resetTask = useCallback(() => {
    setIsRunning(false);
    setCurrentStageIndex(0);
    setAgents(INITIAL_AGENTS);
    setActivityEvents([]);
    setTaskContext(INITIAL_TASK_CONTEXT);
  }, []);

  // Timer auto-progression
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isRunning) {
      timer = setInterval(() => {
        if (currentStageIndex < stagesRef.current.length - 1) {
          stepForward();
        } else {
          setIsRunning(false);
        }
      }, 4500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, currentStageIndex, stepForward]);

  return {
    isRunning,
    setIsRunning,
    currentStageIndex,
    totalStages: stagesRef.current.length,
    agents,
    activityEvents,
    taskContext,
    startTask,
    stepForward,
    resetTask,
  };
}
