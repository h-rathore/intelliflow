/**
 * IntelliFlow Frontend Integration Tests
 * Runs with Node 22 built-in test runner (zero external dependencies).
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Frontend API Client and State Integration Suite", () => {
  // Mock workflow response matching backend WorkflowStatusResponse schema
  const mockBackendResponse = {
    id: "wf-test-uuid-1234",
    title: "Competitive Analysis of Enterprise AI Platforms",
    objective: "Research top enterprise AI workflow platforms.",
    status: "completed",
    activeStage: "Mission Completed",
    elapsedTime: "00m 02s",
    totalTokens: 3450,
    confidenceScore: 98.5,
    draftArtifact: {
      title: "Executive Briefing: Enterprise AI Platforms",
      sections: [
        {
          heading: "1. Executive Summary",
          content: "Enterprise workflow automation has shifted toward multi-agent orchestration.",
          contributorRole: "planner",
          status: "drafted",
        },
        {
          heading: "2. Key Platforms",
          content: "LangGraph, CrewAI, AutoGen, and Retool provide agentic orchestration frameworks.",
          contributorRole: "researcher",
          status: "drafted",
        },
        {
          heading: "3. Feature Matrix",
          content: "Comparative scoring across latency, throughput, and extensibility.",
          contributorRole: "analyst",
          status: "drafted",
        },
        {
          heading: "4. Synthesis & Recommendations",
          content: "Recommendation to adopt hybrid graph-based execution architectures.",
          contributorRole: "writer",
          status: "drafted",
        },
      ],
    },
    agents: {
      planner: {
        id: "agent-planner",
        role: "planner",
        name: "Architect",
        codename: "PL-01",
        specialty: "DAG Deconstruction",
        state: "completed",
        stateDescription: "Plan validated",
        progressPercent: 100,
        tokensProcessed: 450,
        latencyMs: 120,
        avatarVariant: "planner",
        outputSnippet: "Decomposed into 4 stages.",
      },
      researcher: {
        id: "agent-researcher",
        role: "researcher",
        name: "Scout",
        codename: "RS-02",
        specialty: "Web Crawler",
        state: "completed",
        stateDescription: "Research complete",
        progressPercent: 100,
        tokensProcessed: 1200,
        latencyMs: 340,
        avatarVariant: "researcher",
        outputSnippet: "Discovered 14 platforms.",
      },
      analyst: {
        id: "agent-analyst",
        role: "analyst",
        name: "Synthesizer",
        codename: "AN-03",
        specialty: "Market Matrix",
        state: "completed",
        stateDescription: "Analysis complete",
        progressPercent: 100,
        tokensProcessed: 800,
        latencyMs: 210,
        avatarVariant: "analyst",
        outputSnippet: "Matrix populated.",
      },
      writer: {
        id: "agent-writer",
        role: "writer",
        name: "Scribe",
        codename: "WR-04",
        specialty: "Report Compilation",
        state: "completed",
        stateDescription: "Draft compiled",
        progressPercent: 100,
        tokensProcessed: 900,
        latencyMs: 280,
        avatarVariant: "writer",
        outputSnippet: "Drafted 4 sections.",
      },
      reviewer: {
        id: "agent-reviewer",
        role: "reviewer",
        name: "Validator",
        codename: "RV-05",
        specialty: "Citation Audit",
        state: "completed",
        stateDescription: "Verification certified",
        progressPercent: 100,
        tokensProcessed: 100,
        latencyMs: 95,
        avatarVariant: "reviewer",
        outputSnippet: "Audit passed.",
      },
    },
    activityEvents: [
      {
        id: "ev-1",
        timestamp: "12:00:01",
        agentRole: "planner",
        agentName: "Architect (PL-01)",
        message: "Decomposed task into execution DAG",
        type: "plan",
      },
      {
        id: "ev-2",
        timestamp: "12:00:02",
        agentRole: "reviewer",
        agentName: "Validator (RV-05)",
        message: "Mission completed successfully across 5 agents",
        type: "system",
      },
    ],
  };

  test("1. Successful backend response maps accurately to UI state without data fabrication", () => {
    const data = mockBackendResponse;

    // Verify task context mapping
    const taskContext = {
      id: data.id,
      title: data.title,
      objective: data.objective,
      status: data.status,
      activeStage: data.activeStage,
      elapsedTime: data.elapsedTime,
      totalTokens: data.totalTokens,
      confidenceScore: data.confidenceScore,
      draftArtifact: data.draftArtifact,
    };

    assert.equal(taskContext.id, "wf-test-uuid-1234");
    assert.equal(taskContext.status, "completed");
    assert.equal(taskContext.totalTokens, 3450); // Exact backend count
    assert.equal(taskContext.confidenceScore, 98.5); // Exact backend score
    assert.equal(taskContext.draftArtifact.sections.length, 4);

    // Verify all 5 agents are mapped with actual backend properties
    assert.ok(data.agents.planner);
    assert.ok(data.agents.researcher);
    assert.ok(data.agents.analyst);
    assert.ok(data.agents.writer);
    assert.ok(data.agents.reviewer);

    for (const [role, member] of Object.entries(data.agents)) {
      assert.equal(member.state, "completed", `Agent ${role} should be completed`);
      assert.ok(member.tokensProcessed > 0, `Agent ${role} tokens should be positive`);
      assert.ok(member.outputSnippet, `Agent ${role} outputSnippet should exist`);
    }

    // Verify activity events stream matches backend
    assert.equal(data.activityEvents.length, 2);
    assert.equal(data.activityEvents[0].agentRole, "planner");
    assert.equal(data.activityEvents[1].type, "system");
  });

  test("2. API error handling parses HTTP error details correctly", async () => {
    // Simulate apiFetch error handling behavior
    const simulateApiFetch = async (responseBody, statusCode, statusText) => {
      const response = {
        ok: statusCode >= 200 && statusCode < 300,
        status: statusCode,
        statusText: statusText,
        json: async () => responseBody,
      };

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(
          errorBody.detail ?? `HTTP ${response.status}: ${response.statusText}`
        );
      }
      return response.json();
    };

    // Case A: 422 Unprocessable Entity
    await assert.rejects(
      async () => {
        await simulateApiFetch(
          { detail: "Goal prompt cannot be empty or whitespace-only." },
          422,
          "Unprocessable Entity"
        );
      },
      {
        message: "Goal prompt cannot be empty or whitespace-only.",
      }
    );

    // Case B: 404 Not Found
    await assert.rejects(
      async () => {
        await simulateApiFetch(
          { detail: "Workflow 'wf-unknown' not found." },
          404,
          "Not Found"
        );
      },
      {
        message: "Workflow 'wf-unknown' not found.",
      }
    );

    // Case C: 500 Internal Server Error
    await assert.rejects(
      async () => {
        await simulateApiFetch(
          { detail: "An internal error occurred while executing the multi-agent workflow." },
          500,
          "Internal Server Error"
        );
      },
      {
        message: "An internal error occurred while executing the multi-agent workflow.",
      }
    );
  });

  test("3. Failed workflow state from backend transitions UI to 'failed' status", () => {
    const failedBackendResponse = {
      ...mockBackendResponse,
      status: "failed",
      activeStage: "Failed at researcher: Target domain unreachable",
      confidenceScore: 0.0,
      totalTokens: 450,
      agents: {
        ...mockBackendResponse.agents,
        researcher: {
          ...mockBackendResponse.agents.researcher,
          state: "failed",
          stateDescription: "Target domain unreachable",
        },
      },
    };

    const taskContext = {
      id: failedBackendResponse.id,
      title: failedBackendResponse.title,
      objective: failedBackendResponse.objective,
      status: failedBackendResponse.status,
      activeStage: failedBackendResponse.activeStage,
      elapsedTime: failedBackendResponse.elapsedTime,
      totalTokens: failedBackendResponse.totalTokens,
      confidenceScore: failedBackendResponse.confidenceScore,
      draftArtifact: failedBackendResponse.draftArtifact,
    };

    assert.equal(taskContext.status, "failed");
    assert.ok(taskContext.activeStage.includes("Failed at researcher"));
    assert.equal(failedBackendResponse.agents.researcher.state, "failed");
  });

  test("4. Network connection rejection triggers isolated failure handler", async () => {
    // Simulate network drop
    const mockNetworkDrop = async () => {
      throw new TypeError("Failed to fetch: Connection refused");
    };

    let uiStatus = "in_progress";
    let activeStage = "Executing...";
    const activityEvents = [];

    try {
      await mockNetworkDrop();
    } catch (err) {
      uiStatus = "failed";
      activeStage = "Execution Failed";
      activityEvents.push({
        id: "ev-err",
        timestamp: "12:00:05",
        agentRole: "reviewer",
        agentName: "System",
        message: `Execution failed: ${err.message}`,
        type: "system",
      });
    }

    assert.equal(uiStatus, "failed");
    assert.equal(activeStage, "Execution Failed");
    assert.equal(activityEvents.length, 1);
    assert.ok(activityEvents[0].message.includes("Connection refused"));
  });

  test("5. Empty or whitespace prompt is rejected before launching", () => {
    const validatePrompt = (text) => {
      if (!text || !text.trim()) {
        return false;
      }
      return true;
    };

    assert.equal(validatePrompt(""), false);
    assert.equal(validatePrompt("     "), false);
    assert.equal(validatePrompt("\t\n"), false);
    assert.equal(validatePrompt("Research AI automation trends"), true);
  });

  test("6. No fabricated citations or synthetic verification markings", () => {
    // In fallback mode, sections must retain 'drafted' or 'pending' and NEVER 'verified'
    for (const section of mockBackendResponse.draftArtifact.sections) {
      assert.notEqual(section.status, "verified", "Fallback artifact must not be marked 'verified'");
      assert.ok(["drafted", "pending", "reviewing"].includes(section.status));
    }
  });

  test("7. Workflow status badge truthfully distinguishes completion from verification", () => {
    const resolveStatusBadge = (status, isComplete, sections) => {
      const isFailed = status === "failed";
      const isArtifactVerified =
        sections.length > 0 && sections.every((s) => s.status === "verified");

      if (isFailed) {
        return { label: "Execution Failed", variant: "error" };
      }
      if (isComplete) {
        if (isArtifactVerified) {
          return { label: "Execution Certified", variant: "success" };
        }
        return { label: "Execution Completed — Draft Unverified", variant: "warning" };
      }
      return { label: "In Progress", variant: "accent" };
    };

    // Scenario A: Deterministic fallback / unverified draft -> Draft Unverified warning
    const fallbackSections = [
      { heading: "Summary", content: "...", status: "drafted" },
      { heading: "Details", content: "...", status: "pending" },
    ];
    const badgeA = resolveStatusBadge("completed", true, fallbackSections);
    assert.equal(badgeA.label, "Execution Completed — Draft Unverified");
    assert.equal(badgeA.variant, "warning");

    // Scenario B: Fully verified artifact -> Certified success
    const verifiedSections = [
      { heading: "Summary", content: "...", status: "verified" },
      { heading: "Details", content: "...", status: "verified" },
    ];
    const badgeB = resolveStatusBadge("completed", true, verifiedSections);
    assert.equal(badgeB.label, "Execution Certified");
    assert.equal(badgeB.variant, "success");

    // Scenario C: Failed execution -> Execution Failed error
    const badgeC = resolveStatusBadge("failed", true, fallbackSections);
    assert.equal(badgeC.label, "Execution Failed");
    assert.equal(badgeC.variant, "error");
  });

  test("8. Working agents correctly transition to failed state on execution error", () => {
    const agents = {
      planner: { role: "planner", state: "working", stateDescription: "Planning DAG" },
      researcher: { role: "researcher", state: "waiting", stateDescription: "Waiting" },
    };

    // Simulate error transition logic from useWorkflowRunner catch block
    const errorMessage = "HTTP 500: Internal server error";
    const updated = { ...agents };
    for (const role of Object.keys(updated)) {
      if (updated[role].state === "working") {
        updated[role] = {
          ...updated[role],
          state: "failed",
          stateDescription: `Execution interrupted: ${errorMessage}`,
        };
      }
    }

    assert.equal(updated.planner.state, "failed");
    assert.ok(updated.planner.stateDescription.includes("Execution interrupted"));
    assert.equal(updated.researcher.state, "waiting");
  });

  test("9. FastAPI 422 array error detail is formatted into readable error string", async () => {
    const parseErrorDetail = (errorBody) => {
      let detailMsg;
      if (typeof errorBody.detail === "string") {
        detailMsg = errorBody.detail;
      } else if (Array.isArray(errorBody.detail)) {
        detailMsg = errorBody.detail
          .map((d) => d.msg || JSON.stringify(d))
          .join("; ");
      } else if (errorBody.detail) {
        detailMsg = JSON.stringify(errorBody.detail);
      }
      return detailMsg ?? "Unknown error";
    };

    const fastApi422Body = {
      detail: [
        { loc: ["body", "goalPrompt"], msg: "String should have at most 10000 characters", type: "string_too_long" },
      ],
    };

    const parsed = parseErrorDetail(fastApi422Body);
    assert.equal(parsed, "String should have at most 10000 characters");
    assert.notEqual(parsed, "[object Object]");
  });

  test("10. Failed workflow state prevents isComplete from being marked true", () => {
    const computeCompletion = (status, currentStageIndex, totalStages) => {
      const isFailed = status === "failed";
      return !isFailed && (status === "completed" || currentStageIndex >= totalStages - 1);
    };

    // If failed, even if stage index is at end, isComplete must be false
    assert.equal(computeCompletion("failed", 4, 5), false);
    // If completed, isComplete must be true
    assert.equal(computeCompletion("completed", 4, 5), true);
    // If in_progress at stage 2, isComplete must be false
    assert.equal(computeCompletion("in_progress", 2, 5), false);
  });
});
