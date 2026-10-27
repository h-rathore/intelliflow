"""
IntelliFlow Backend — Persistence Models (SQLAlchemy 2.0)
"""

from datetime import datetime, timezone
from typing import Any, Optional
from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """SQLAlchemy declarative base for IntelliFlow entities."""
    pass


class WorkflowRecord(Base):
    """Persistent execution record for a multi-agent workflow."""
    __tablename__ = "workflows"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), default="")
    goal_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="idle")
    active_stage: Mapped[str] = mapped_column(String(128), default="")
    elapsed_time: Mapped[str] = mapped_column(String(32), default="00m 00s")
    total_tokens: Mapped[int] = mapped_column(Integer, default=0)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0)
    agents_state_json: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    activity_events_json: Mapped[Optional[list[dict[str, Any]]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # 1:1 relationship with ArtifactRecord
    artifact: Mapped[Optional["ArtifactRecord"]] = relationship(
        back_populates="workflow",
        cascade="all, delete-orphan",
        uselist=False,
    )


class ArtifactRecord(Base):
    """Persistent storage for generated research and analysis reports."""
    __tablename__ = "artifacts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    workflow_id: Mapped[str] = mapped_column(
        ForeignKey("workflows.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), default="")
    sections_json: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    markdown_content: Mapped[str] = mapped_column(Text, default="")
    verified_status: Mapped[str] = mapped_column(String(32), default="pending")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationship back to parent workflow
    workflow: Mapped["WorkflowRecord"] = relationship(back_populates="artifact")
