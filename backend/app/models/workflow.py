"""
IntelliFlow Backend — Workflow & Artifact Schemas
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from app.models.agent import AgentRole, AgentWorkforceMember, ActivityEvent


class SectionStatus(str, Enum):
    """Artifact section verification states."""
    DRAFTED = "drafted"
    REVIEWING = "reviewing"
    VERIFIED = "verified"
    PENDING = "pending"


class WorkflowStatus(str, Enum):
    """Overall workflow lifecycle status."""
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    PAUSED = "paused"
    IDLE = "idle"
    FAILED = "failed"


class TaskSection(BaseModel):
    """Individual section within a generated draft artifact."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    heading: str
    content: str
    contributor_role: AgentRole
    status: SectionStatus = SectionStatus.PENDING


class DraftArtifact(BaseModel):
    """Structured artifact container compiled by agents."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    title: str
    sections: list[TaskSection] = Field(default_factory=list)


class WorkflowCreateRequest(BaseModel):
    """Request payload to initiate a multi-agent workflow."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    goal_prompt: str = Field(..., min_length=1, description="Natural language task or objective")
    execution_mode: str = Field(default="autonomous", description="Execution mode: autonomous or step-by-step")
    model: str = Field(default="gemini-1.5-flash", description="Target LLM identifier")


class WorkflowStatusResponse(BaseModel):
    """Full execution context and state representation."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    id: str
    title: str
    objective: str
    status: WorkflowStatus = WorkflowStatus.IDLE
    active_stage: str = ""
    elapsed_time: str = "00m 00s"
    total_tokens: int = 0
    confidence_score: float = 0.0
    draft_artifact: DraftArtifact
    agents: Optional[dict[str, AgentWorkforceMember]] = None
    activity_events: Optional[list[ActivityEvent]] = None
