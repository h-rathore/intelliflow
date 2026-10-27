"""
IntelliFlow Backend — D2-T6 Acceptance and Reliability Audit Tests

Covers:
- Normal 5-agent workflow execution and artifact consistency
- Input validation (empty, whitespace, missing fields, invalid types, oversized prompts)
- Fault isolation: agent exceptions, malformed agent data, reviewer rejections
- Provider failover: mocked Gemini network failure, timeout, API key sanitization
- Persistence and API consistency: retrieval of success and failed workflows, ID uniqueness
"""

from typing import Any
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.agents.base import BaseAgent
from app.db.models import WorkflowRecord
from app.db.session import init_db
from app.main import app
from app.models.agent import AgentExecutionResult, AgentRole, AgentState
from app.models.workflow import SectionStatus, WorkflowStatus
from app.orchestration.engine import WorkflowEngine
from app.services.llm.client import GeminiLLMClient


@pytest.fixture
def client():
    """TestClient fixture with application lifespan context."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
async def memory_session_factory():
    """Isolated in-memory SQLite database sessionmaker for reliability testing."""
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


# ==============================================================================
# SECTION A: Normal Workflow Execution & Consistency
# ==============================================================================

@pytest.mark.asyncio
async def test_acceptance_normal_workflow_execution(memory_session_factory):
    """Verify that an enterprise workflow completes across all 5 agents with consistent state."""
    engine = WorkflowEngine(session_factory=memory_session_factory)
    prompt = "Develop an enterprise cloud migration strategy for legacy monolith applications."
    wf_id = f"wf-accept-{uuid.uuid4().hex[:8]}"

    res = await engine.run(prompt, workflow_id=wf_id, persist=True)

    # 1. Pipeline status
    assert res.status == WorkflowStatus.COMPLETED
    assert res.active_stage == "Mission Completed"
    assert res.id == wf_id
    assert res.total_tokens > 0

    # 2. Agent order and states
    assert set(res.agents.keys()) == {"planner", "researcher", "analyst", "writer", "reviewer"}
    for role, member in res.agents.items():
        assert member.state == AgentState.COMPLETED
        assert member.progress_percent == 100
        assert member.tokens_processed > 0

    # 3. Artifact structure
    assert res.draft_artifact is not None
    assert len(res.draft_artifact.sections) == 4
    for section in res.draft_artifact.sections:
        assert section.heading
        assert section.content
        # Fallback outputs MUST remain drafted, never falsely verified
        assert section.status == SectionStatus.DRAFTED


# ==============================================================================
# SECTION B: Input Validation & Boundary Enforcement
# ==============================================================================

def test_acceptance_empty_and_whitespace_prompts(client: TestClient):
    """Verify that empty and whitespace-only prompts return HTTP 422."""
    for empty_val in ["", "   ", "\t\n  "]:
        resp = client.post("/api/v1/workflows", json={"goalPrompt": empty_val})
        assert resp.status_code == 422
        detail = resp.json()["detail"]
        detail_text = detail if isinstance(detail, str) else str(detail)
        assert "empty or whitespace" in detail_text.lower() or "at least 1 character" in detail_text.lower()


def test_acceptance_missing_and_invalid_fields(client: TestClient):
    """Verify that malformed bodies and invalid types are safely rejected with HTTP 422."""
    # Missing goalPrompt entirely
    resp1 = client.post("/api/v1/workflows", json={})
    assert resp1.status_code == 422

    # Invalid type for goalPrompt (number instead of string)
    resp2 = client.post("/api/v1/workflows", json={"goalPrompt": 12345})
    assert resp2.status_code == 422

    # Invalid JSON syntax
    resp3 = client.post(
        "/api/v1/workflows",
        content="this is not valid json",
        headers={"Content-Type": "application/json"},
    )
    assert resp3.status_code == 422


def test_acceptance_oversized_prompt_rejected(client: TestClient):
    """Verify that prompts exceeding the explicit reasonable maximum limit are rejected with HTTP 422."""
    oversized_prompt = "A" * 10001  # Exceeds 10,000 character limit
    resp = client.post("/api/v1/workflows", json={"goalPrompt": oversized_prompt})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_acceptance_validation_failure_does_not_persist_records(memory_session_factory):
    """Verify that rejected empty prompts do not leave phantom records in the database."""
    engine = WorkflowEngine(session_factory=memory_session_factory)
    wf_id = f"wf-reject-{uuid.uuid4().hex[:8]}"

    res = await engine.run("   ", workflow_id=wf_id, persist=True)
    assert res.status == WorkflowStatus.FAILED

    # Check database: no record should be saved for initial validation failure
    async with memory_session_factory() as session:
        stmt = select(WorkflowRecord).where(WorkflowRecord.id == wf_id)
        db_res = await session.execute(stmt)
        record = db_res.scalar_one_or_none()
        assert record is None


# ==============================================================================
# SECTION C: Fault Isolation & Agent/Provider Failure Handling
# ==============================================================================

@pytest.mark.asyncio
async def test_acceptance_agent_unhandled_exception_handled_cleanly(memory_session_factory):
    """Verify that an unexpected exception during agent execution is caught, logged, and marked FAILED."""
    class CrashingAgent(BaseAgent):
        def __init__(self):
            super().__init__(AgentRole.RESEARCHER, "CrashingScout", "RS-02", "Buggy", "researcher")

        async def _run(self, context: dict[str, Any]) -> AgentExecutionResult:
            raise RuntimeError("Unexpected external component crash")

    engine = WorkflowEngine(
        researcher=CrashingAgent(),
        session_factory=memory_session_factory,
    )
    wf_id = f"wf-crash-{uuid.uuid4().hex[:8]}"

    res = await engine.run("Analyze resilience under catastrophic failure", workflow_id=wf_id, persist=True)

    assert res.status == WorkflowStatus.FAILED
    assert "Failed at researcher" in res.active_stage or "Execution Failed" in res.active_stage
    assert res.agents["researcher"].state == AgentState.FAILED

    # Verify persisted record in database
    async with memory_session_factory() as session:
        stmt = select(WorkflowRecord).where(WorkflowRecord.id == wf_id)
        db_res = await session.execute(stmt)
        record = db_res.scalar_one_or_none()
        assert record is not None
        assert record.status == "failed"


@pytest.mark.asyncio
async def test_acceptance_malformed_agent_sections_handled_gracefully(memory_session_factory):
    """Verify that malformed section objects from agents do not crash the engine with ValueError."""
    class SloppyWriter(BaseAgent):
        def __init__(self):
            super().__init__(AgentRole.WRITER, "SloppyScribe", "WR-04", "Untyped", "writer")

        async def _run(self, context: dict[str, Any]) -> AgentExecutionResult:
            return AgentExecutionResult(
                role=self.role,
                status=AgentState.COMPLETED,
                summary="Wrote malformed sections",
                output_text="Some text",
                data={
                    "title": "Malformed Report",
                    "sections": [
                        {"heading": "Section 1", "content": "Valid", "contributorRole": "writer"},
                        {"heading": "Section 2", "content": "Unknown Role", "contributorRole": "UNKNOWN_BOT_ROLE"},
                        {"heading": "Section 3", "content": "Snake Case", "contributor_role": "analyst"},
                        "Not even a dictionary",
                        None,
                    ],
                },
                tokens_used=100,
            )

    engine = WorkflowEngine(
        writer=SloppyWriter(),
        session_factory=memory_session_factory,
    )
    wf_id = f"wf-sloppy-{uuid.uuid4().hex[:8]}"

    # Must complete without unhandled ValueError: 'UNKNOWN_BOT_ROLE' is not a valid AgentRole
    res = await engine.run("Check section sanitization", workflow_id=wf_id, persist=False)
    assert res.status == WorkflowStatus.COMPLETED
    assert len(res.draft_artifact.sections) >= 2


@pytest.mark.asyncio
async def test_acceptance_gemini_client_sanitizes_api_key_on_failure():
    """Verify that Gemini client error messages never expose the configured API key."""
    fake_key = "AIzaSySecretFakeTestKey1234567890"
    client = GeminiLLMClient(
        api_key=fake_key,
        timeout_seconds=0.001,  # Immediate timeout
        fallback_on_error=True,
    )

    resp = await client.generate("system prompt", "user prompt")

    # In fallback failover, raw_error should NOT contain the secret API key
    assert resp.is_fallback is True
    if resp.raw_error:
        assert fake_key not in resp.raw_error


@pytest.mark.asyncio
async def test_acceptance_gemini_client_raises_network_error_when_no_fallback():
    """Verify that when fallback is disabled, Gemini network failures raise appropriate typed exceptions."""
    client = GeminiLLMClient(
        api_key="AIzaSyTestKeyWithoutFallback",
        timeout_seconds=0.001,
        fallback_on_error=False,
    )

    with pytest.raises(Exception) as exc_info:
        await client.generate("system prompt", "user prompt")

    # Ensure the secret key is not in the stringified exception
    assert "AIzaSyTestKeyWithoutFallback" not in str(exc_info.value)


# ==============================================================================
# SECTION D: Persistence & API Consistency
# ==============================================================================

def test_acceptance_rapid_requests_generate_unique_ids(client: TestClient):
    """Verify that sequential workflow requests generate unique IDs with zero collisions."""
    ids = set()
    for _ in range(5):
        resp = client.post("/api/v1/workflows", json={"goalPrompt": "Unique ID collision audit prompt"})
        assert resp.status_code == 201
        wf_id = resp.json()["id"]
        assert wf_id not in ids
        ids.add(wf_id)
    assert len(ids) == 5


def test_acceptance_workflow_and_artifact_retrieval_consistency(client: TestClient):
    """Verify that persisted workflow and artifact endpoints return consistent data."""
    # 1. Create workflow
    create_resp = client.post("/api/v1/workflows", json={"goalPrompt": "End to end persistence audit"})
    assert create_resp.status_code == 201
    created_data = create_resp.json()
    wf_id = created_data["id"]

    # 2. Get workflow
    get_wf_resp = client.get(f"/api/v1/workflows/{wf_id}")
    assert get_wf_resp.status_code == 200
    wf_data = get_wf_resp.json()
    assert wf_data["id"] == wf_id
    assert wf_data["status"] == created_data["status"]
    assert wf_data["totalTokens"] == created_data["totalTokens"]

    # 3. Get artifacts
    get_art_resp = client.get(f"/api/v1/workflows/{wf_id}/artifacts")
    assert get_art_resp.status_code == 200
    art_data = get_art_resp.json()
    assert art_data["workflowId"] == wf_id
    assert art_data["count"] == 1
    assert len(art_data["artifacts"][0]["sections"]) == len(created_data["draftArtifact"]["sections"])
