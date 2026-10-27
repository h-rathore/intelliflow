"""
IntelliFlow Backend — Workflow Orchestration Tests
"""

import asyncio
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.agents.base import BaseAgent
from app.agents.planner import PlannerAgent
from app.agents.researcher import ResearcherAgent
from app.agents.analyst import AnalystAgent
from app.agents.writer import WriterAgent
from app.agents.reviewer import ReviewerAgent
from app.db.models import ArtifactRecord, WorkflowRecord
from app.db.session import init_db
from app.models.agent import AgentExecutionResult, AgentRole, AgentState
from app.models.workflow import WorkflowStatus
from app.orchestration.engine import WorkflowEngine


@pytest.fixture
async def test_session_factory():
    """Create an isolated, in-memory SQLite database sessionmaker for testing."""
    test_engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        future=True,
    )
    await init_db(target_engine=test_engine)

    session_factory = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    yield session_factory
    await test_engine.dispose()


@pytest.fixture
def sample_goal() -> str:
    return "Research the impact of artificial intelligence on education and prepare a structured report."


@pytest.mark.asyncio
async def test_successful_five_agent_execution_order(sample_goal: str, test_session_factory):
    """Verify that all five agents execute in the exact required order."""
    call_order = []

    class OrderTrackingAgent(BaseAgent):
        def __init__(self, role, name, codename):
            super().__init__(role, name, codename, "Testing", role.value)

        async def _run(self, context):
            call_order.append(self.role.value)
            if self.role == AgentRole.WRITER:
                return AgentExecutionResult(
                    role=self.role,
                    status=AgentState.COMPLETED,
                    summary="Drafted report",
                    output_text="# Report\n## 1. Executive Summary\nContent\n## 2. Findings\nContent\n## 3. Insights\nContent\n## 4. Recommendations\nContent",
                    data={"sections": [{"heading": "1. Executive Summary", "content": "Text", "contributorRole": "writer", "status": "drafted"}]},
                    tokens_used=100,
                )
            if self.role == AgentRole.REVIEWER:
                return AgentExecutionResult(
                    role=self.role,
                    status=AgentState.COMPLETED,
                    summary="Approved",
                    output_text="Audit OK",
                    data={"is_approved": True, "confidence_score": 100.0, "checks": {"goal_alignment": True}},
                    tokens_used=50,
                )
            return AgentExecutionResult(
                role=self.role,
                status=AgentState.COMPLETED,
                summary=f"Done {self.role.value}",
                output_text="Content",
                data={},
                tokens_used=75,
            )

    engine = WorkflowEngine(
        planner=OrderTrackingAgent(AgentRole.PLANNER, "Architect", "PL-01"),
        researcher=OrderTrackingAgent(AgentRole.RESEARCHER, "Scout", "RS-02"),
        analyst=OrderTrackingAgent(AgentRole.ANALYST, "Synthesizer", "AN-03"),
        writer=OrderTrackingAgent(AgentRole.WRITER, "Scribe", "WR-04"),
        reviewer=OrderTrackingAgent(AgentRole.REVIEWER, "Validator", "RV-05"),
        session_factory=test_session_factory,
    )

    resp = await engine.run(sample_goal, workflow_id="wf-order-test", persist=False)

    assert call_order == ["planner", "researcher", "analyst", "writer", "reviewer"]
    assert resp.status == WorkflowStatus.COMPLETED
    assert resp.total_tokens == (75 * 3) + 100 + 50  # 375 tokens exactly


@pytest.mark.asyncio
async def test_context_and_output_propagation(sample_goal: str, test_session_factory):
    """Verify that actual outputs from prior stages propagate to downstream stages."""
    observed_contexts = {}

    class ContextInspectingAgent(BaseAgent):
        def __init__(self, role, name, codename):
            super().__init__(role, name, codename, "Inspect", role.value)

        async def _run(self, context):
            observed_contexts[self.role.value] = dict(context)
            if self.role == AgentRole.PLANNER:
                return AgentExecutionResult(
                    role=self.role,
                    status=AgentState.COMPLETED,
                    summary="Plan created",
                    output_text="Plan",
                    data={"subtasks": ["task1", "task2"]},
                    tokens_used=50,
                )
            elif self.role == AgentRole.RESEARCHER:
                return AgentExecutionResult(
                    role=self.role,
                    status=AgentState.COMPLETED,
                    summary="Research collected",
                    output_text="Findings",
                    data={"findings": ["finding1"]},
                    tokens_used=60,
                )
            elif self.role == AgentRole.ANALYST:
                return AgentExecutionResult(
                    role=self.role,
                    status=AgentState.COMPLETED,
                    summary="Analysis compiled",
                    output_text="Metrics",
                    data={"metrics": [{"dimension": "latency"}]},
                    tokens_used=70,
                )
            elif self.role == AgentRole.WRITER:
                return AgentExecutionResult(
                    role=self.role,
                    status=AgentState.COMPLETED,
                    summary="Report written",
                    output_text="# Full Report",
                    data={"sections": [], "title": "Report Title"},
                    tokens_used=80,
                )
            else:
                return AgentExecutionResult(
                    role=self.role,
                    status=AgentState.COMPLETED,
                    summary="Audit complete",
                    output_text="Audit OK",
                    data={"is_approved": True, "confidence_score": 90.0},
                    tokens_used=30,
                )

    engine = WorkflowEngine(
        planner=ContextInspectingAgent(AgentRole.PLANNER, "Architect", "PL-01"),
        researcher=ContextInspectingAgent(AgentRole.RESEARCHER, "Scout", "RS-02"),
        analyst=ContextInspectingAgent(AgentRole.ANALYST, "Synthesizer", "AN-03"),
        writer=ContextInspectingAgent(AgentRole.WRITER, "Scribe", "WR-04"),
        reviewer=ContextInspectingAgent(AgentRole.REVIEWER, "Validator", "RV-05"),
        session_factory=test_session_factory,
    )

    await engine.run(sample_goal, persist=False)

    # 1. Researcher received Planner's subtasks
    assert "plan_data" in observed_contexts["researcher"]
    assert observed_contexts["researcher"]["plan_data"]["subtasks"] == ["task1", "task2"]

    # 2. Analyst received Researcher's findings
    assert "research_data" in observed_contexts["analyst"]
    assert observed_contexts["analyst"]["research_data"]["findings"] == ["finding1"]

    # 3. Writer received Plan, Research, and Analysis
    assert "analysis_data" in observed_contexts["writer"]
    assert "research_data" in observed_contexts["writer"]

    # 4. Reviewer received compiled report text
    assert observed_contexts["reviewer"]["report_text"] == "# Full Report"


@pytest.mark.asyncio
async def test_full_pipeline_with_real_agents_and_persistence(sample_goal: str, test_session_factory):
    """Verify end-to-end execution with real agents, deterministic fallback, and SQLite persistence."""
    engine = WorkflowEngine(
        planner=PlannerAgent(),
        researcher=ResearcherAgent(),
        analyst=AnalystAgent(),
        writer=WriterAgent(),
        reviewer=ReviewerAgent(),
        session_factory=test_session_factory,
    )

    wf_id = "wf-persistence-e2e"
    resp = await engine.run(sample_goal, workflow_id=wf_id, persist=True)

    # 1. Assert response structure
    assert resp.id == wf_id
    assert resp.status == WorkflowStatus.COMPLETED
    assert resp.confidence_score >= 70.0
    assert resp.total_tokens > 0
    assert len(resp.draft_artifact.sections) == 4
    assert len(resp.activity_events) >= 6

    # 2. Assert all 5 agents are completed
    for role in ("planner", "researcher", "analyst", "writer", "reviewer"):
        assert resp.agents[role].state == AgentState.COMPLETED
        assert resp.agents[role].tokens_processed > 0

    # 3. Assert database records were persisted
    async with test_session_factory() as session:
        stmt = select(WorkflowRecord).where(WorkflowRecord.id == wf_id)
        db_res = await session.execute(stmt)
        record = db_res.scalar_one_or_none()

        assert record is not None
        assert record.id == wf_id
        assert record.status == "completed"
        assert record.total_tokens == resp.total_tokens
        assert record.confidence_score == resp.confidence_score

        # Query linked artifact
        stmt_art = select(ArtifactRecord).where(ArtifactRecord.workflow_id == wf_id)
        art_res = await session.execute(stmt_art)
        art_record = art_res.scalar_one_or_none()

        assert art_record is not None
        assert art_record.workflow_id == wf_id
        assert len(art_record.sections_json) == 4
        assert art_record.verified_status in ("verified", "pending")


@pytest.mark.asyncio
async def test_reviewer_flagged_status_remains_visible(sample_goal: str, test_session_factory):
    """Verify that a reviewer flag or non-approved status remains visible in output."""
    class FlaggingReviewer(BaseAgent):
        def __init__(self):
            super().__init__(AgentRole.REVIEWER, "Validator", "RV-05", "Audit", "reviewer")

        async def _run(self, context):
            return AgentExecutionResult(
                role=self.role,
                status=AgentState.COMPLETED,
                summary="Audit FLAGGED (2/4 checks passed)",
                output_text="Audit notes: Missing citations",
                data={
                    "is_approved": False,
                    "confidence_score": 50.0,
                    "flags": ["Missing citations", "Unsupported quantitative claims"],
                },
                tokens_used=40,
            )

    engine = WorkflowEngine(
        planner=PlannerAgent(),
        researcher=ResearcherAgent(),
        analyst=AnalystAgent(),
        writer=WriterAgent(),
        reviewer=FlaggingReviewer(),
        session_factory=test_session_factory,
    )

    resp = await engine.run(sample_goal, persist=False)

    assert resp.status == WorkflowStatus.COMPLETED
    assert resp.confidence_score == 50.0
    # The flag event is recorded in the activity stream
    assert any("Flagged" in e.message for e in resp.activity_events)


@pytest.mark.asyncio
async def test_agent_failure_stops_pipeline(sample_goal: str, test_session_factory):
    """Verify that an agent failure halts execution and records the failed stage."""
    class FailingResearcher(BaseAgent):
        def __init__(self):
            super().__init__(AgentRole.RESEARCHER, "Scout", "RS-02", "Crawler", "researcher")

        async def _run(self, context):
            return AgentExecutionResult(
                role=self.role,
                status=AgentState.FAILED,
                summary="Remote context unreachable",
                output_text="Connection refused",
                provenance="error",
                tokens_used=10,
            )

    engine = WorkflowEngine(
        planner=PlannerAgent(),
        researcher=FailingResearcher(),
        analyst=AnalystAgent(),
        writer=WriterAgent(),
        reviewer=ReviewerAgent(),
        session_factory=test_session_factory,
    )

    resp = await engine.run(sample_goal, workflow_id="wf-fail-test", persist=True)

    assert resp.status == WorkflowStatus.FAILED
    assert "Failed at researcher" in resp.active_stage
    assert resp.agents["researcher"].state == AgentState.FAILED
    # Downstream agents were NOT executed
    assert resp.agents["analyst"].state == AgentState.WAITING
    assert resp.agents["writer"].state == AgentState.WAITING
    assert resp.agents["reviewer"].state == AgentState.WAITING


@pytest.mark.asyncio
async def test_workflow_execution_timeout(sample_goal: str, test_session_factory):
    """Verify workflow enforces timeout without unhandled crashes."""
    class HangingPlanner(BaseAgent):
        def __init__(self):
            super().__init__(AgentRole.PLANNER, "Architect", "PL-01", "Plan", "planner")

        async def _run(self, context):
            await asyncio.sleep(2.0)
            return AgentExecutionResult(
                role=self.role,
                status=AgentState.COMPLETED,
                summary="Done",
                output_text="Done",
            )

    engine = WorkflowEngine(
        planner=HangingPlanner(),
        researcher=ResearcherAgent(),
        analyst=AnalystAgent(),
        writer=WriterAgent(),
        reviewer=ReviewerAgent(),
        session_factory=test_session_factory,
        timeout_seconds=0.1,  # 100ms timeout
    )

    resp = await engine.run(sample_goal, persist=False)

    assert resp.status == WorkflowStatus.FAILED
    assert "Timed Out" in resp.active_stage
    assert any("timed out" in e.message.lower() for e in resp.activity_events)


@pytest.mark.asyncio
async def test_empty_goal_prompt_rejected(test_session_factory):
    """Verify empty goal prompt is rejected with FAILED status and 0 tokens."""
    engine = WorkflowEngine(session_factory=test_session_factory)
    resp = await engine.run("", persist=False)

    assert resp.status == WorkflowStatus.FAILED
    assert resp.total_tokens == 0
    assert "empty" in resp.objective.lower()
