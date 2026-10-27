"""
IntelliFlow Backend — Benchmark Suite Unit & Correctness Tests
"""

import pytest

from app.benchmarks.runner import (
    AgentTimingMetric,
    FALLBACK_PROVENANCE_NOTE,
    RunMetric,
    calculate_percentile,
    calculate_summary_statistics,
    run_workflow_benchmark,
    sanitize_config,
)


def test_calculate_summary_statistics_success_and_failure_rates():
    """Verify success/failure counts and success-rate calculation on mixed outcomes."""
    runs = [
        RunMetric(
            run_id="run-1",
            iteration=1,
            prompt="Prompt 1",
            status="completed",
            duration_seconds=0.15,
            provider="mock_fallback",
            is_fallback=True,
            total_tokens=1200,
        ),
        RunMetric(
            run_id="run-2",
            iteration=1,
            prompt="Prompt 2",
            status="completed",
            duration_seconds=0.25,
            provider="mock_fallback",
            is_fallback=True,
            total_tokens=1400,
        ),
        RunMetric(
            run_id="run-3",
            iteration=2,
            prompt="Prompt 1",
            status="completed",
            duration_seconds=0.20,
            provider="mock_fallback",
            is_fallback=True,
            total_tokens=1300,
        ),
        RunMetric(
            run_id="run-4",
            iteration=2,
            prompt="Prompt 2",
            status="failed",
            duration_seconds=0.05,
            provider="mock_fallback",
            is_fallback=True,
            total_tokens=0,
            error="Simulated failure",
        ),
    ]

    summary = calculate_summary_statistics(runs)

    assert summary.total_runs == 4
    assert summary.successful_runs == 3
    assert summary.failed_runs == 1
    assert summary.success_rate_percent == 75.0

    # Latency includes all valid durations
    assert summary.latency.count == 4
    assert summary.latency.min_seconds == 0.05
    assert summary.latency.max_seconds == 0.25
    assert summary.latency.median_seconds == 0.175
    assert summary.latency.mean_seconds == 0.1625


def test_percentile_calculation_and_edge_cases():
    """Verify linear interpolation percentile calculation across known distributions."""
    # Empty list
    assert calculate_percentile([], 95.0) == 0.0

    # Single value
    assert calculate_percentile([0.42], 95.0) == 0.42

    # Deterministic sequence: 10 sorted values from 0.1 to 1.0
    vals = [round(i * 0.1, 1) for i in range(1, 11)]  # [0.1, 0.2, ..., 1.0]
    p50 = calculate_percentile(vals, 50.0)
    assert p50 == 0.55

    p95 = calculate_percentile(vals, 95.0)
    # k = 9 * 0.95 = 8.55 -> index 8 (0.9) and 9 (1.0) -> 0.9 + 0.55 * 0.1 = 0.955
    assert round(p95, 3) == 0.955

    # 100th percentile is max
    assert calculate_percentile(vals, 100.0) == 1.0
    # 0th percentile is min
    assert calculate_percentile(vals, 0.0) == 0.1


def test_failed_executions_retained_in_reliability_metrics():
    """Verify failed executions are retained in the runs list and accounted for in reliability."""
    runs = [
        RunMetric(
            run_id="run-fail-1",
            iteration=1,
            prompt="Prompt A",
            status="failed",
            duration_seconds=0.08,
            provider="mock_fallback",
            is_fallback=True,
            total_tokens=0,
            error="Connection timed out",
        ),
        RunMetric(
            run_id="run-fail-2",
            iteration=2,
            prompt="Prompt A",
            status="failed",
            duration_seconds=0.07,
            provider="mock_fallback",
            is_fallback=True,
            total_tokens=0,
            error="Rate limit triggered",
        ),
    ]

    summary = calculate_summary_statistics(runs)

    assert summary.total_runs == 2
    assert summary.successful_runs == 0
    assert summary.failed_runs == 2
    assert summary.success_rate_percent == 0.0
    # Both durations remain present
    assert summary.latency.count == 2
    assert summary.tokens.total_tokens_sum == 0


def test_missing_metadata_handled_safely():
    """Verify empty runs list and zero-token metrics compute without division by zero."""
    empty_summary = calculate_summary_statistics([])
    assert empty_summary.total_runs == 0
    assert empty_summary.successful_runs == 0
    assert empty_summary.failed_runs == 0
    assert empty_summary.success_rate_percent == 0.0
    assert empty_summary.latency.mean_seconds == 0.0
    assert empty_summary.tokens.total_tokens_sum == 0

    run_no_agents = RunMetric(
        run_id="run-empty-meta",
        iteration=1,
        prompt="Empty prompt",
        status="completed",
        duration_seconds=0.10,
        provider="mock_fallback",
        is_fallback=True,
        total_tokens=0,
        agent_metrics={},
    )
    summary = calculate_summary_statistics([run_no_agents])
    assert summary.total_runs == 1
    assert summary.tokens.total_tokens_sum == 0
    assert summary.tokens.mean_tokens == 0.0


def test_provenance_disclaimer_and_fallback_labeling():
    """Verify fallback mode is explicitly identified and never claims live research or factual verification."""
    runs = [
        RunMetric(
            run_id="run-fallback",
            iteration=1,
            prompt="Research task",
            status="completed",
            duration_seconds=0.20,
            provider="mock_fallback",
            is_fallback=True,
            total_tokens=1500,
        )
    ]
    summary = calculate_summary_statistics(runs)
    assert "mock_fallback" in summary.tokens.token_accounting_note
    assert "heuristic word-length estimates" in summary.tokens.token_accounting_note
    assert "do NOT reflect Google Gemini" in summary.tokens.token_accounting_note
    assert FALLBACK_PROVENANCE_NOTE == summary.tokens.token_accounting_note


def test_sanitize_config_strips_secrets():
    """Verify sensitive environment variables and credentials are never leaked into the report."""
    raw_config = {
        "provider": "gemini",
        "gemini_api_key": "AIzaSySecretKey1234567890",
        "api_secret": "my-secret-token",
        "auth_password": "super-password",
        "timeout_seconds": 60,
        "iterations": 5,
        "database_url": "sqlite+aiosqlite:///./test.db",
    }

    sanitized = sanitize_config(raw_config)

    assert "gemini_api_key" not in sanitized
    assert "api_secret" not in sanitized
    assert "auth_password" not in sanitized
    assert sanitized["provider"] == "gemini"
    assert sanitized["timeout_seconds"] == 60
    assert sanitized["iterations"] == 5
    assert sanitized["database_url"] == "sqlite+aiosqlite:///./test.db"


@pytest.mark.asyncio
async def test_gemini_provider_requires_explicit_opt_in():
    """Verify requesting Gemini provider without allow_live_api=True raises an error immediately."""
    with pytest.raises(ValueError, match="Live Gemini benchmarking requires explicit opt-in"):
        await run_workflow_benchmark(
            prompts=["Test goal"],
            iterations_per_prompt=1,
            provider="gemini",
            allow_live_api=False,
        )


@pytest.mark.asyncio
async def test_end_to_end_deterministic_benchmark_execution():
    """Verify running the benchmark end-to-end against the existing WorkflowEngine produces a valid report."""
    test_prompts = [
        "Audit pull request diffs and run AST static checks.",
        "Ingest balance sheet tables and check equations.",
    ]

    report = await run_workflow_benchmark(
        prompts=test_prompts,
        iterations_per_prompt=1,
        provider="mock_fallback",
        persist=False,
    )

    # 1. High-level report container
    assert report.benchmark_version == "0.1.0"
    assert report.config["provider"] == "mock_fallback"
    assert report.config["is_fallback"] is True
    assert report.config["total_runs"] == 2
    assert "key" not in str(report.config).lower()

    # 2. Metadata
    assert report.metadata.python_version != ""
    assert report.metadata.platform != ""
    assert report.metadata.timestamp_utc != ""

    # 3. Summary
    assert report.summary.total_runs == 2
    assert report.summary.successful_runs == 2
    assert report.summary.failed_runs == 0
    assert report.summary.success_rate_percent == 100.0
    assert report.summary.latency.mean_seconds > 0.0
    assert report.summary.latency.median_seconds > 0.0
    assert report.summary.tokens.total_tokens_sum > 0

    # 4. Runs and per-agent metrics
    assert len(report.runs) == 2
    for run in report.runs:
        assert run.status == "completed"
        assert run.is_fallback is True
        assert run.duration_seconds > 0.0
        assert run.total_tokens > 0
        # Check that agent metrics were captured
        assert "planner" in run.agent_metrics
        assert "researcher" in run.agent_metrics
        assert "analyst" in run.agent_metrics
        assert "writer" in run.agent_metrics
        assert "reviewer" in run.agent_metrics

        for role, agent_metric in run.agent_metrics.items():
            assert isinstance(agent_metric, AgentTimingMetric)
            assert agent_metric.tokens_processed > 0
            assert agent_metric.state == "completed"

    # 5. Serialization to JSON
    json_str = report.model_dump_json(indent=2)
    assert "mock_fallback" in json_str
    assert "AIzaSy" not in json_str
