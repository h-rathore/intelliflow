"""
IntelliFlow Backend — Persistence Tests
"""

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.models import Base, WorkflowRecord, ArtifactRecord
from app.db.session import init_db


@pytest.fixture
async def test_session():
    """Create an isolated, in-memory SQLite database for testing."""
    test_engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        future=True,
    )
    # Initialize schema
    await init_db(target_engine=test_engine)

    session_factory = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with session_factory() as session:
        yield session

    await test_engine.dispose()


@pytest.mark.asyncio
async def test_database_initialization(test_session: AsyncSession):
    """Verify that required tables are created in the database."""
    table_names = Base.metadata.tables.keys()
    assert "workflows" in table_names
    assert "artifacts" in table_names


@pytest.mark.asyncio
async def test_create_and_retrieve_workflow(test_session: AsyncSession):
    """Verify storing and retrieving a workflow execution record."""
    workflow = WorkflowRecord(
        id="wf-unit-test-1",
        title="Test Workflow",
        goal_prompt="Analyze cloud architecture trends",
        status="in_progress",
        active_stage="Stage 1: Planning",
        total_tokens=500,
        confidence_score=92.5,
        agents_state_json={"planner": {"state": "completed"}},
        activity_events_json=[{"id": "ev-1", "message": "Planning started"}],
    )
    test_session.add(workflow)
    await test_session.commit()

    # Query back
    stmt = select(WorkflowRecord).where(WorkflowRecord.id == "wf-unit-test-1")
    result = await test_session.execute(stmt)
    retrieved = result.scalar_one_or_none()

    assert retrieved is not None
    assert retrieved.id == "wf-unit-test-1"
    assert retrieved.title == "Test Workflow"
    assert retrieved.goal_prompt == "Analyze cloud architecture trends"
    assert retrieved.status == "in_progress"
    assert retrieved.total_tokens == 500
    assert retrieved.confidence_score == 92.5
    assert retrieved.agents_state_json == {"planner": {"state": "completed"}}
    assert len(retrieved.activity_events_json) == 1


@pytest.mark.asyncio
async def test_artifact_persistence_and_relationship(test_session: AsyncSession):
    """Verify persisting an artifact linked to a workflow via foreign key."""
    workflow = WorkflowRecord(
        id="wf-unit-test-2",
        title="Report Generation Workflow",
        goal_prompt="Generate AI market research",
        status="completed",
    )
    test_session.add(workflow)
    await test_session.flush()

    artifact = ArtifactRecord(
        id="art-unit-test-2",
        workflow_id=workflow.id,
        title="AI Market Report",
        sections_json=[
            {
                "heading": "Executive Summary",
                "content": "AI market is expanding rapidly.",
                "contributorRole": "writer",
                "status": "verified",
            }
        ],
        markdown_content="# AI Market Report\n\nExecutive Summary...",
        verified_status="verified",
    )
    test_session.add(artifact)
    await test_session.commit()

    # Query workflow with artifact eagerly or through relationship
    stmt = select(WorkflowRecord).where(WorkflowRecord.id == "wf-unit-test-2")
    res = await test_session.execute(stmt)
    fetched_wf = res.scalar_one_or_none()

    assert fetched_wf is not None
    # Access relationship
    stmt_art = select(ArtifactRecord).where(ArtifactRecord.workflow_id == fetched_wf.id)
    res_art = await test_session.execute(stmt_art)
    fetched_art = res_art.scalar_one_or_none()

    assert fetched_art is not None
    assert fetched_art.title == "AI Market Report"
    assert fetched_art.workflow_id == "wf-unit-test-2"
    assert len(fetched_art.sections_json) == 1
    assert fetched_art.verified_status == "verified"


@pytest.mark.asyncio
async def test_cascade_delete_artifact(test_session: AsyncSession):
    """Verify that deleting a workflow cascades to delete its linked artifact."""
    workflow = WorkflowRecord(
        id="wf-unit-test-3",
        title="Temporary Workflow",
        goal_prompt="Temporary goal",
        status="completed",
    )
    test_session.add(workflow)
    await test_session.flush()

    artifact = ArtifactRecord(
        id="art-unit-test-3",
        workflow_id=workflow.id,
        title="Temporary Artifact",
    )
    test_session.add(artifact)
    await test_session.commit()

    # Delete workflow
    await test_session.delete(workflow)
    await test_session.commit()

    # Confirm artifact was cascade-deleted
    stmt = select(ArtifactRecord).where(ArtifactRecord.id == "art-unit-test-3")
    res = await test_session.execute(stmt)
    assert res.scalar_one_or_none() is None
