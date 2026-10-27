"""
IntelliFlow Backend — Reproducible Performance Benchmark Runner

Measures execution duration, reliability, agent latencies, and token metadata
for the five-agent workflow engine across representative enterprise prompts.
"""

import argparse
import asyncio
from datetime import datetime, timezone
import math
import os
from pathlib import Path
import platform
import statistics
import subprocess
import time
from typing import Any, Optional

from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.logging import logger
from app.models.workflow import WorkflowStatus
from app.orchestration.engine import WorkflowEngine


DEFAULT_PROMPTS = [
    "Research the top enterprise AI automation platforms and prepare a competitive analysis.",
    "Audit pull request diffs, execute static AST linters, and generate pytest regression suites.",
    "Ingest multi-page corporate balance sheets, extract GAAP tables, and run verification equations.",
    "Evaluate customer support tickets, score urgency, and dispatch CRM alerts to engineers.",
]

FALLBACK_PROVENANCE_NOTE = (
    "This benchmark was executed using the local DeterministicFallbackEngine (mock_fallback). "
    "Reported token counts are heuristic word-length estimates and do NOT reflect Google Gemini "
    "API tokens, billing units, or live web research. All outputs are synthetic draft artifacts."
)


class AgentTimingMetric(BaseModel):
    """Timing and token metrics for an individual agent stage."""
    latency_ms: int = 0
    tokens_processed: int = 0
    state: str = "unknown"


class RunMetric(BaseModel):
    """Recorded metrics for an individual workflow execution run."""
    run_id: str
    iteration: int
    prompt: str
    status: str  # "completed" | "failed"
    duration_seconds: float
    provider: str
    is_fallback: bool
    total_tokens: int = 0
    confidence_score: float = 0.0
    active_stage: str = ""
    agent_metrics: dict[str, AgentTimingMetric] = Field(default_factory=dict)
    error: Optional[str] = None


class LatencySummary(BaseModel):
    """Aggregate latency metrics across benchmark runs."""
    count: int = 0
    mean_seconds: float = 0.0
    median_seconds: float = 0.0
    min_seconds: float = 0.0
    max_seconds: float = 0.0
    p95_seconds: float = 0.0


class TokenSummary(BaseModel):
    """Aggregate token metrics across benchmark runs."""
    total_tokens_sum: int = 0
    mean_tokens: float = 0.0
    median_tokens: float = 0.0
    min_tokens: int = 0
    max_tokens: int = 0
    token_accounting_note: str


class BenchmarkSummary(BaseModel):
    """High-level summary of benchmark execution performance and reliability."""
    total_runs: int
    successful_runs: int
    failed_runs: int
    success_rate_percent: float
    latency: LatencySummary
    tokens: TokenSummary


class SystemMetadata(BaseModel):
    """Execution environment details."""
    python_version: str
    platform: str
    git_revision: Optional[str] = None
    timestamp_utc: str


class BenchmarkReport(BaseModel):
    """Machine-readable benchmark output container."""
    benchmark_version: str = "0.1.0"
    metadata: SystemMetadata
    config: dict[str, Any]
    summary: BenchmarkSummary
    runs: list[RunMetric]
    provenance_disclaimer: str


def calculate_percentile(sorted_values: list[float], percentile: float) -> float:
    """Calculate the p-th percentile of a sorted list using linear interpolation."""
    if not sorted_values:
        return 0.0
    if len(sorted_values) == 1:
        return sorted_values[0]

    k = (len(sorted_values) - 1) * (percentile / 100.0)
    f = math.floor(k)
    c = math.ceil(k)

    if f == c:
        return sorted_values[int(k)]

    weight = k - f
    return sorted_values[f] * (1.0 - weight) + sorted_values[c] * weight


def calculate_summary_statistics(
    runs: list[RunMetric],
    token_accounting_note: str = FALLBACK_PROVENANCE_NOTE,
) -> BenchmarkSummary:
    """Compute aggregate statistical metrics across recorded benchmark runs."""
    total_runs = len(runs)
    if total_runs == 0:
        return BenchmarkSummary(
            total_runs=0,
            successful_runs=0,
            failed_runs=0,
            success_rate_percent=0.0,
            latency=LatencySummary(),
            tokens=TokenSummary(token_accounting_note=token_accounting_note),
        )

    successful_runs = sum(1 for r in runs if r.status == WorkflowStatus.COMPLETED.value)
    failed_runs = total_runs - successful_runs
    success_rate_percent = round((successful_runs / total_runs) * 100.0, 2)

    # Durations include all completed execution runs
    durations = sorted(r.duration_seconds for r in runs if r.duration_seconds > 0)
    if durations:
        latency = LatencySummary(
            count=len(durations),
            mean_seconds=round(statistics.mean(durations), 4),
            median_seconds=round(statistics.median(durations), 4),
            min_seconds=round(min(durations), 4),
            max_seconds=round(max(durations), 4),
            p95_seconds=round(calculate_percentile(durations, 95.0), 4),
        )
    else:
        latency = LatencySummary()

    # Token counts
    token_counts = [r.total_tokens for r in runs if r.total_tokens > 0]
    if token_counts:
        tokens = TokenSummary(
            total_tokens_sum=sum(token_counts),
            mean_tokens=round(statistics.mean(token_counts), 2),
            median_tokens=round(statistics.median(token_counts), 2),
            min_tokens=min(token_counts),
            max_tokens=max(token_counts),
            token_accounting_note=token_accounting_note,
        )
    else:
        tokens = TokenSummary(token_accounting_note=token_accounting_note)

    return BenchmarkSummary(
        total_runs=total_runs,
        successful_runs=successful_runs,
        failed_runs=failed_runs,
        success_rate_percent=success_rate_percent,
        latency=latency,
        tokens=tokens,
    )


def get_git_revision() -> Optional[str]:
    """Retrieve the current Git commit hash if in a Git repository."""
    try:
        proc = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            capture_output=True,
            text=True,
            timeout=3,
            check=False,
        )
        if proc.returncode == 0 and proc.stdout.strip():
            return proc.stdout.strip()
    except Exception:
        pass
    return None


def sanitize_config(raw_config: dict[str, Any]) -> dict[str, Any]:
    """Ensure no secrets, keys, or sensitive environment variables leak into benchmark reports."""
    sensitive_substrings = ("key", "secret", "token", "password", "auth", "credential")
    sanitized: dict[str, Any] = {}
    for k, v in raw_config.items():
        if any(sub in k.lower() for sub in sensitive_substrings):
            continue
        sanitized[k] = v
    return sanitized


async def run_workflow_benchmark(
    prompts: Optional[list[str]] = None,
    iterations_per_prompt: int = 2,
    provider: str = "mock_fallback",
    persist: bool = False,
    allow_live_api: bool = False,
    output_path: Optional[str] = None,
) -> BenchmarkReport:
    """
    Execute the workflow engine across prompts and iterations, capturing timing,
    token counts, and reliability statistics.
    """
    target_prompts = prompts or DEFAULT_PROMPTS
    active_provider = provider.lower()

    if active_provider == "gemini" and not allow_live_api:
        raise ValueError(
            "Live Gemini benchmarking requires explicit opt-in via allow_live_api=True. "
            "By default, benchmarks must run offline with mock_fallback."
        )

    is_fallback = active_provider == "mock_fallback"
    logger.info(
        "Starting benchmark: %d prompts, %d iterations each (total %d runs) using provider '%s'",
        len(target_prompts),
        iterations_per_prompt,
        len(target_prompts) * iterations_per_prompt,
        active_provider,
    )

    runs: list[RunMetric] = []
    engine = WorkflowEngine()

    run_index = 0
    for prompt_idx, prompt in enumerate(target_prompts, start=1):
        for iter_idx in range(1, iterations_per_prompt + 1):
            run_index += 1
            run_id = f"bench-p{prompt_idx}-i{iter_idx}-{run_index}"

            t_start = time.perf_counter()
            try:
                response = await engine.run(
                    goal_prompt=prompt,
                    workflow_id=run_id,
                    persist=persist,
                )
                duration = time.perf_counter() - t_start

                # Collect per-agent metrics
                agent_metrics: dict[str, AgentTimingMetric] = {}
                if response.agents:
                    for role, member in response.agents.items():
                        agent_metrics[role] = AgentTimingMetric(
                            latency_ms=member.latency_ms,
                            tokens_processed=member.tokens_processed,
                            state=member.state.value if hasattr(member.state, "value") else str(member.state),
                        )

                metric = RunMetric(
                    run_id=run_id,
                    iteration=iter_idx,
                    prompt=prompt,
                    status=response.status.value if hasattr(response.status, "value") else str(response.status),
                    duration_seconds=round(duration, 4),
                    provider=active_provider,
                    is_fallback=is_fallback,
                    total_tokens=response.total_tokens,
                    confidence_score=response.confidence_score,
                    active_stage=response.active_stage,
                    agent_metrics=agent_metrics,
                    error=None,
                )
            except Exception as err:
                duration = time.perf_counter() - t_start
                logger.error("Benchmark run %s raised unexpected exception: %s", run_id, str(err))
                metric = RunMetric(
                    run_id=run_id,
                    iteration=iter_idx,
                    prompt=prompt,
                    status=WorkflowStatus.FAILED.value,
                    duration_seconds=round(duration, 4),
                    provider=active_provider,
                    is_fallback=is_fallback,
                    total_tokens=0,
                    confidence_score=0.0,
                    active_stage="Exception Caught",
                    agent_metrics={},
                    error=f"{type(err).__name__}: {str(err)}",
                )

            runs.append(metric)

    summary = calculate_summary_statistics(
        runs=runs,
        token_accounting_note=FALLBACK_PROVENANCE_NOTE if is_fallback else "Live Gemini API Token Metadata",
    )

    metadata = SystemMetadata(
        python_version=platform.python_version(),
        platform=platform.platform(),
        git_revision=get_git_revision(),
        timestamp_utc=datetime.now(timezone.utc).isoformat(),
    )

    raw_config = {
        "provider": active_provider,
        "is_fallback": is_fallback,
        "iterations_per_prompt": iterations_per_prompt,
        "prompts_count": len(target_prompts),
        "total_runs": len(runs),
        "persist_to_db": persist,
        "timeout_seconds": settings.execution_timeout_seconds,
    }

    report = BenchmarkReport(
        benchmark_version="0.1.0",
        metadata=metadata,
        config=sanitize_config(raw_config),
        summary=summary,
        runs=runs,
        provenance_disclaimer=FALLBACK_PROVENANCE_NOTE if is_fallback else "Live API Benchmark Execution",
    )

    if output_path:
        out_file = Path(output_path)
        out_file.parent.mkdir(parents=True, exist_ok=True)
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(report.model_dump_json(indent=2))
        logger.info("Saved benchmark report to %s", out_file.resolve())

    return report


def main() -> None:
    """CLI entrypoint for executing workflow benchmarks."""
    parser = argparse.ArgumentParser(
        description="IntelliFlow Workflow Engine Reproducible Benchmark Runner",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--iterations", "-n",
        type=int,
        default=2,
        help="Number of iterations per prompt (e.g. 2 iterations across 4 prompts = 8 runs)",
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        default=None,
        help="Path to write JSON benchmark report",
    )
    parser.add_argument(
        "--persist",
        action="store_true",
        default=False,
        help="Persist benchmark runs into SQLite database",
    )
    parser.add_argument(
        "--provider",
        type=str,
        default="mock_fallback",
        choices=["mock_fallback", "gemini"],
        help="AI provider mode",
    )
    parser.add_argument(
        "--live-api",
        action="store_true",
        default=False,
        help="Explicitly permit live API calls if provider is 'gemini'",
    )

    args = parser.parse_args()

    report = asyncio.run(
        run_workflow_benchmark(
            iterations_per_prompt=args.iterations,
            provider=args.provider,
            persist=args.persist,
            allow_live_api=args.live_api,
            output_path=args.output,
        )
    )

    s = report.summary
    print("\n" + "=" * 60)
    print("  INTELLIFLOW WORKFLOW ENGINE BENCHMARK RESULTS")
    print("=" * 60)
    print(f"Provider:        {report.config.get('provider')} (Fallback: {report.config.get('is_fallback')})")
    print(f"Total Runs:      {s.total_runs}")
    print(f"Success Rate:    {s.success_rate_percent}% ({s.successful_runs} passed, {s.failed_runs} failed)")
    print("-" * 60)
    print("Latency Metrics (Wall-Clock Seconds):")
    print(f"  Mean:          {s.latency.mean_seconds:.4f}s")
    print(f"  Median:        {s.latency.median_seconds:.4f}s")
    print(f"  Min:           {s.latency.min_seconds:.4f}s")
    print(f"  Max:           {s.latency.max_seconds:.4f}s")
    print(f"  P95:           {s.latency.p95_seconds:.4f}s")
    print("-" * 60)
    print("Token Metrics:")
    print(f"  Mean Tokens:   {s.tokens.mean_tokens:.1f}")
    print(f"  Median Tokens: {s.tokens.median_tokens:.1f}")
    print(f"  Total Sum:     {s.tokens.total_tokens_sum}")
    print("=" * 60)
    print(f"Note: {report.provenance_disclaimer[:90]}...")
    if args.output:
        print(f"JSON Report:     {os.path.abspath(args.output)}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
