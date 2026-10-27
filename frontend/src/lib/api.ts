/**
 * IntelliFlow — API Client Utilities
 */

import { HealthResponse } from "@/types";
import { WorkflowStatusResponse, WorkflowArtifactsResponse } from "@/types/workforce";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

/**
 * Base fetch helper.
 * Throws if the response is not ok.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as {
      detail?: string | Array<{ msg?: string }> | Record<string, unknown>;
    };
    let detailMsg: string | undefined;
    if (typeof errorBody.detail === "string") {
      detailMsg = errorBody.detail;
    } else if (Array.isArray(errorBody.detail)) {
      detailMsg = errorBody.detail
        .map((d) => d.msg || JSON.stringify(d))
        .join("; ");
    } else if (errorBody.detail) {
      detailMsg = JSON.stringify(errorBody.detail);
    }

    throw new Error(
      detailMsg ?? `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Fetch backend health status with timeout handling.
 */
export async function fetchHealthStatus(timeoutMs = 4000): Promise<{
  data: HealthResponse | null;
  ok: boolean;
  latencyMs: number;
  error?: string;
}> {
  const startTime = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${API_BASE_URL}/api/v1/health`;
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      return {
        data: null,
        ok: false,
        latencyMs,
        error: `HTTP ${response.status}`,
      };
    }

    const data = (await response.json()) as HealthResponse;
    return {
      data,
      ok: true,
      latencyMs,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);
    const errorMessage =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Request timed out"
          : err.message
        : "Failed to connect";

    return {
      data: null,
      ok: false,
      latencyMs,
      error: errorMessage,
    };
  }
}

export interface CreateWorkflowParams {
  goalPrompt: string;
  executionMode?: "autonomous" | "step-by-step";
  model?: string;
}

/**
 * Execute a multi-agent workflow on the backend.
 * Calls POST /api/v1/workflows
 */
export async function createWorkflow(
  params: CreateWorkflowParams | string
): Promise<WorkflowStatusResponse> {
  const payload =
    typeof params === "string"
      ? { goalPrompt: params, executionMode: "autonomous", model: "gemini-1.5-flash" }
      : {
          goalPrompt: params.goalPrompt,
          executionMode: params.executionMode ?? "autonomous",
          model: params.model ?? "gemini-1.5-flash",
        };

  return apiFetch<WorkflowStatusResponse>("/api/v1/workflows", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Retrieve workflow execution state by ID.
 * Calls GET /api/v1/workflows/:id
 */
export async function getWorkflow(
  workflowId: string
): Promise<WorkflowStatusResponse> {
  return apiFetch<WorkflowStatusResponse>(
    `/api/v1/workflows/${encodeURIComponent(workflowId)}`
  );
}

/**
 * Retrieve artifacts compiled by a workflow.
 * Calls GET /api/v1/workflows/:id/artifacts
 */
export async function getWorkflowArtifacts(
  workflowId: string
): Promise<WorkflowArtifactsResponse> {
  return apiFetch<WorkflowArtifactsResponse>(
    `/api/v1/workflows/${encodeURIComponent(workflowId)}/artifacts`
  );
}

/**
 * List recent workflow executions.
 * Calls GET /api/v1/workflows
 */
export async function listRecentWorkflows(
  limit = 20
): Promise<Array<Record<string, unknown>>> {
  return apiFetch<Array<Record<string, unknown>>>(
    `/api/v1/workflows?limit=${limit}`
  );
}
