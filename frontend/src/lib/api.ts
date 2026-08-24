/**
 * IntelliFlow — API Client Utilities
 */

import { HealthResponse } from "@/types";

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
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      (errorBody as { detail?: string }).detail ??
        `HTTP ${response.status}: ${response.statusText}`
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
