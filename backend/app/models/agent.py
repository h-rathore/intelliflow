"""
IntelliFlow Backend — Agent Schemas & Enums
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class AgentRole(str, Enum):
    """Specialized AI agent roles matching concept document & frontend."""
    PLANNER = "planner"
    RESEARCHER = "researcher"
    ANALYST = "analyst"
    WRITER = "writer"
    REVIEWER = "reviewer"


class AgentState(str, Enum):
    """Runtime states of an individual agent."""
    IDLE = "idle"
    THINKING = "thinking"
    PLANNING = "planning"
    WORKING = "working"
    WAITING = "waiting"
    COMPLETED = "completed"
    FAILED = "failed"


class ActivityEventType(str, Enum):
    """Event classification types for the activity stream."""
    PLAN = "plan"
    DISCOVERY = "discovery"
    SYNTHESIS = "synthesis"
    DRAFT = "draft"
    CRITIQUE = "critique"
    SYSTEM = "system"


class AgentWorkforceMember(BaseModel):
    """Agent entity representation with live execution metrics."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    id: str
    role: AgentRole
    name: str
    codename: str
    specialty: str
    state: AgentState = AgentState.IDLE
    state_description: str = ""
    active_tool: Optional[str] = None
    current_thought: Optional[str] = None
    output_snippet: Optional[str] = None
    progress_percent: int = 0
    tokens_processed: int = 0
    latency_ms: int = 0
    avatar_variant: str = "planner"


class ActivityEvent(BaseModel):
    """Individual execution event logged to the activity stream."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    id: str
    timestamp: str
    agent_role: AgentRole
    agent_name: str
    message: str
    type: ActivityEventType
    meta: Optional[dict[str, str | int]] = None


class AgentExecutionResult(BaseModel):
    """Structured execution output produced by an agent."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    role: AgentRole
    status: AgentState
    summary: str
    output_text: str
    data: dict[str, object] = {}
    provenance: str = "synthetic_fallback"
    is_fallback: bool = True
    tokens_used: int = 0
    latency_ms: int = 0
