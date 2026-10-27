"""
IntelliFlow Backend — API v1: Workflows Router
"""

from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.db.models import ArtifactRecord, WorkflowRecord
from app.db.session import get_db
from app.models.agent import ActivityEvent, AgentWorkforceMember
from app.models.workflow import (
    DraftArtifact,
    TaskSection,
    WorkflowCreateRequest,
    WorkflowStatus,
    WorkflowStatusResponse,
)
from app.orchestration.engine import WorkflowEngine

router = APIRouter(prefix="/workflows", tags=["Workflows"])


@router.post(
    "",
    response_model=WorkflowStatusResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Execute Multi-Agent Workflow",
    description="Initiates an end-to-end multi-agent workflow for the provided natural language goal.",
)
async def create_and_run_workflow(
    request: WorkflowCreateRequest,
    session: AsyncSession = Depends(get_db),
) -> WorkflowStatusResponse:
    """Validate goal prompt, trigger WorkflowEngine, and return execution results."""
    clean_goal = request.goal_prompt.strip() if request.goal_prompt else ""
    if not clean_goal:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Goal prompt cannot be empty or whitespace-only.",
        )

    logger.info("Received workflow request: '%s...'", clean_goal[:50])

    try:
        engine = WorkflowEngine()
        result = await engine.run(goal_prompt=clean_goal, persist=True)
        return result
    except Exception as err:
        logger.error("Unexpected error during workflow orchestration: %s", str(err), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while executing the multi-agent workflow.",
        )


@router.get(
    "/{workflow_id}",
    response_model=WorkflowStatusResponse,
    summary="Get Workflow Execution State",
    description="Retrieves a persisted workflow execution record by its unique ID.",
)
async def get_workflow(
    workflow_id: str,
    session: AsyncSession = Depends(get_db),
) -> WorkflowStatusResponse:
    """Retrieve persisted workflow record and its associated artifact from database."""
    stmt = select(WorkflowRecord).where(WorkflowRecord.id == workflow_id)
    res = await session.execute(stmt)
    record = res.scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow '{workflow_id}' not found.",
        )

    # Query linked artifact
    stmt_art = select(ArtifactRecord).where(ArtifactRecord.workflow_id == workflow_id)
    art_res = await session.execute(stmt_art)
    artifact = art_res.scalar_one_or_none()

    # Reconstruct DraftArtifact
    sections: list[TaskSection] = []
    artifact_title = record.title
    if artifact and artifact.sections_json:
        artifact_title = artifact.title
        for s in artifact.sections_json:
            sections.append(
                TaskSection(
                    heading=s.get("heading", ""),
                    content=s.get("content", ""),
                    contributor_role=s.get("contributorRole", "writer"),
                    status=s.get("status", "drafted"),
                )
            )

    draft_artifact = DraftArtifact(title=artifact_title, sections=sections)

    # Reconstruct agents map
    agents: Optional[dict[str, AgentWorkforceMember]] = None
    if record.agents_state_json:
        agents = {k: AgentWorkforceMember(**v) for k, v in record.agents_state_json.items()}

    # Reconstruct activity events
    events: Optional[list[ActivityEvent]] = None
    if record.activity_events_json:
        events = [ActivityEvent(**e) for e in record.activity_events_json]

    return WorkflowStatusResponse(
        id=record.id,
        title=record.title,
        objective=record.goal_prompt,
        status=WorkflowStatus(record.status),
        active_stage=record.active_stage,
        elapsed_time=record.elapsed_time,
        total_tokens=record.total_tokens,
        confidence_score=record.confidence_score,
        draft_artifact=draft_artifact,
        agents=agents,
        activity_events=events,
    )


@router.get(
    "/{workflow_id}/artifacts",
    response_model=dict[str, Any],
    summary="Get Workflow Artifacts",
    description="Retrieves the generated structured artifact and full Markdown content for a workflow.",
)
async def get_workflow_artifacts(
    workflow_id: str,
    session: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Retrieve artifacts associated with a workflow. Returns 404 if workflow does not exist."""
    stmt = select(WorkflowRecord).where(WorkflowRecord.id == workflow_id)
    res = await session.execute(stmt)
    record = res.scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow '{workflow_id}' not found.",
        )

    stmt_art = select(ArtifactRecord).where(ArtifactRecord.workflow_id == workflow_id)
    art_res = await session.execute(stmt_art)
    artifact = art_res.scalar_one_or_none()

    artifacts_list = []
    if artifact:
        artifacts_list.append({
            "id": artifact.id,
            "workflowId": artifact.workflow_id,
            "title": artifact.title,
            "sections": artifact.sections_json,
            "markdownContent": artifact.markdown_content,
            "verifiedStatus": artifact.verified_status,
            "createdAt": artifact.created_at.isoformat() if artifact.created_at else None,
        })

    return {
        "workflowId": workflow_id,
        "artifacts": artifacts_list,
        "count": len(artifacts_list),
    }


@router.get(
    "",
    response_model=list[dict[str, Any]],
    summary="List Recent Workflows",
    description="Returns a paginated list of recent workflow executions.",
)
async def list_recent_workflows(
    limit: int = 20,
    session: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    """List recent workflows ordered by creation timestamp."""
    stmt = select(WorkflowRecord).order_by(WorkflowRecord.created_at.desc()).limit(limit)
    res = await session.execute(stmt)
    records = res.scalars().all()

    return [
        {
            "id": r.id,
            "title": r.title,
            "goalPrompt": r.goal_prompt,
            "status": r.status,
            "activeStage": r.active_stage,
            "elapsedTime": r.elapsed_time,
            "totalTokens": r.total_tokens,
            "confidenceScore": r.confidence_score,
            "createdAt": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]
