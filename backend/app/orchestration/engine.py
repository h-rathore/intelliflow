"""
IntelliFlow Backend — Asynchronous Workflow Orchestration Engine

Coordinates the five specialized agents (Planner, Researcher, Analyst, Writer, Reviewer)
in a sequential dependency chain, managing state propagation, execution tracing,
token aggregation, failure isolation, and persistence.
"""

import asyncio
from datetime import datetime, timezone
import time
from typing import Any, Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.agents.base import BaseAgent
from app.agents.planner import PlannerAgent
from app.agents.researcher import ResearcherAgent
from app.agents.analyst import AnalystAgent
from app.agents.writer import WriterAgent
from app.agents.reviewer import ReviewerAgent
from app.core.config import settings
from app.core.logging import logger
from app.db.models import ArtifactRecord, WorkflowRecord
from app.db.session import async_session_factory as default_session_factory
from app.models.agent import (
    ActivityEvent,
    ActivityEventType,
    AgentExecutionResult,
    AgentRole,
    AgentState,
    AgentWorkforceMember,
)
from app.models.workflow import (
    DraftArtifact,
    SectionStatus,
    TaskSection,
    WorkflowStatus,
    WorkflowStatusResponse,
)


class WorkflowEngine:
    """
    Orchestrates end-to-end multi-agent execution pipeline.
    Connects: Planner -> Researcher -> Analyst -> Writer -> Reviewer.
    """

    def __init__(
        self,
        planner: Optional[BaseAgent] = None,
        researcher: Optional[BaseAgent] = None,
        analyst: Optional[BaseAgent] = None,
        writer: Optional[BaseAgent] = None,
        reviewer: Optional[BaseAgent] = None,
        session_factory: Optional[async_sessionmaker[AsyncSession]] = None,
        timeout_seconds: Optional[float] = None,
    ):
        self.planner = planner or PlannerAgent()
        self.researcher = researcher or ResearcherAgent()
        self.analyst = analyst or AnalystAgent()
        self.writer = writer or WriterAgent()
        self.reviewer = reviewer or ReviewerAgent()
        self.session_factory = session_factory or default_session_factory
        self.timeout_seconds = timeout_seconds or float(settings.execution_timeout_seconds)

    async def run(
        self,
        goal_prompt: str,
        workflow_id: Optional[str] = None,
        persist: bool = True,
    ) -> WorkflowStatusResponse:
        """
        Execute the full five-agent workflow pipeline with timeout and fault isolation.
        """
        wf_id = workflow_id or f"wf-{uuid.uuid4().hex[:12]}"
        clean_goal = (goal_prompt or "").strip()
        title = f"Investigation: {clean_goal[:45]}..." if len(clean_goal) > 45 else (clean_goal or "Untitled Workflow")

        start_perf = time.perf_counter()
        activity_events: list[ActivityEvent] = []
        execution_trace: list[dict[str, Any]] = []
        agents_map: dict[str, AgentWorkforceMember] = {}

        # Initialize agent UI workforce snapshots
        for agent in (self.planner, self.researcher, self.analyst, self.writer, self.reviewer):
            agents_map[agent.role.value] = agent.to_workforce_member(
                state=AgentState.WAITING,
                state_description="Standing by in pipeline queue",
            )

        def add_event(
            role: AgentRole,
            agent_name: str,
            message: str,
            event_type: ActivityEventType,
            meta: Optional[dict[str, str | int]] = None,
        ) -> None:
            """Append a structured, timestamped event to the activity stream."""
            event = ActivityEvent(
                id=f"ev-{wf_id}-{len(activity_events) + 1}",
                timestamp=datetime.now(timezone.utc).strftime("%H:%M:%S"),
                agent_role=role,
                agent_name=agent_name,
                message=message,
                type=event_type,
                meta=meta,
            )
            activity_events.append(event)

        # Validate non-empty goal upfront
        if not clean_goal:
            add_event(
                role=AgentRole.PLANNER,
                agent_name="Architect",
                message="Workflow rejected: goal prompt is empty.",
                event_type=ActivityEventType.SYSTEM,
            )
            return WorkflowStatusResponse(
                id=wf_id,
                title=title,
                objective="Empty goal provided",
                status=WorkflowStatus.FAILED,
                active_stage="Validation Failure",
                elapsed_time="00m 00s",
                total_tokens=0,
                confidence_score=0.0,
                draft_artifact=DraftArtifact(title="Empty Artifact", sections=[]),
                agents=agents_map,
                activity_events=activity_events,
            )

        add_event(
            role=AgentRole.PLANNER,
            agent_name="Architect",
            message=f"Mission initialized: '{clean_goal[:60]}...'",
            event_type=ActivityEventType.SYSTEM,
        )

        try:
            return await asyncio.wait_for(
                self._execute_pipeline(
                    wf_id=wf_id,
                    clean_goal=clean_goal,
                    title=title,
                    start_perf=start_perf,
                    activity_events=activity_events,
                    execution_trace=execution_trace,
                    agents_map=agents_map,
                    add_event=add_event,
                    persist=persist,
                ),
                timeout=self.timeout_seconds,
            )
        except asyncio.TimeoutError:
            elapsed = time.perf_counter() - start_perf
            elapsed_str = self._format_elapsed(elapsed)
            logger.error("Workflow %s exceeded execution timeout of %ss", wf_id, self.timeout_seconds)

            add_event(
                role=AgentRole.PLANNER,
                agent_name="Architect",
                message=f"Workflow execution timed out after {self.timeout_seconds}s limit.",
                event_type=ActivityEventType.SYSTEM,
            )

            failed_resp = WorkflowStatusResponse(
                id=wf_id,
                title=title,
                objective=clean_goal,
                status=WorkflowStatus.FAILED,
                active_stage="Execution Timed Out",
                elapsed_time=elapsed_str,
                total_tokens=sum(t.get("tokens_used", 0) for t in execution_trace),
                confidence_score=0.0,
                draft_artifact=DraftArtifact(title=f"Timed Out: {title}", sections=[]),
                agents=agents_map,
                activity_events=activity_events,
            )

            if persist:
                await self._persist_workflow(failed_resp, execution_trace, None)

            return failed_resp

    async def _execute_pipeline(
        self,
        wf_id: str,
        clean_goal: str,
        title: str,
        start_perf: float,
        activity_events: list[ActivityEvent],
        execution_trace: list[dict[str, Any]],
        agents_map: dict[str, AgentWorkforceMember],
        add_event: Any,
        persist: bool,
    ) -> WorkflowStatusResponse:
        """Internal sequential execution loop through all 5 agent stages."""
        total_tokens = 0
        active_stage = "Stage 1: Intent & Task Decomposition"

        # ── STAGE 1: PLANNER ──────────────────────────────────────────
        active_stage = "Stage 1: Intent & Task Decomposition"
        self._set_agent_state(agents_map, AgentRole.PLANNER, AgentState.WORKING, "Deconstructing mission into DAG subtasks")
        add_event(AgentRole.PLANNER, self.planner.name, "Deconstructing mission into parallel subtasks and execution DAG", ActivityEventType.PLAN)

        planner_res = await self.planner.execute({"goal_prompt": clean_goal})
        self._record_trace(execution_trace, self.planner, planner_res)
        total_tokens += planner_res.tokens_used

        if planner_res.status == AgentState.FAILED:
            return await self._handle_agent_failure(
                wf_id, clean_goal, title, start_perf, active_stage, planner_res, agents_map, activity_events, execution_trace, persist
            )

        self._set_agent_state(
            agents_map,
            AgentRole.PLANNER,
            AgentState.COMPLETED,
            planner_res.summary,
            progress=100,
            tokens=planner_res.tokens_used,
            latency=planner_res.latency_ms,
            output_snippet=planner_res.output_text[:120],
        )
        add_event(AgentRole.PLANNER, self.planner.name, planner_res.summary, ActivityEventType.PLAN)

        # ── STAGE 2: RESEARCHER ───────────────────────────────────────
        active_stage = "Stage 2: Domain Evidence & Context Ingestion"
        self._set_agent_state(agents_map, AgentRole.RESEARCHER, AgentState.WORKING, "Ingesting domain literature and empirical baselines")
        add_event(AgentRole.RESEARCHER, self.researcher.name, "Crawling verified domain references and contextual literature", ActivityEventType.DISCOVERY)

        researcher_res = await self.researcher.execute({
            "goal_prompt": clean_goal,
            "plan_data": planner_res.data,
        })
        self._record_trace(execution_trace, self.researcher, researcher_res)
        total_tokens += researcher_res.tokens_used

        if researcher_res.status == AgentState.FAILED:
            return await self._handle_agent_failure(
                wf_id, clean_goal, title, start_perf, active_stage, researcher_res, agents_map, activity_events, execution_trace, persist
            )

        self._set_agent_state(
            agents_map,
            AgentRole.RESEARCHER,
            AgentState.COMPLETED,
            researcher_res.summary,
            progress=100,
            tokens=researcher_res.tokens_used,
            latency=researcher_res.latency_ms,
            output_snippet=researcher_res.output_text[:120],
        )
        add_event(AgentRole.RESEARCHER, self.researcher.name, researcher_res.summary, ActivityEventType.DISCOVERY)

        # ── STAGE 3: ANALYST ──────────────────────────────────────────
        active_stage = "Stage 3: Quantitative & Comparative Benchmarking"
        self._set_agent_state(agents_map, AgentRole.ANALYST, AgentState.WORKING, "Correlating metrics and capability benchmarks")
        add_event(AgentRole.ANALYST, self.analyst.name, "Cross-correlating architecture metrics and building comparative matrix", ActivityEventType.SYNTHESIS)

        analyst_res = await self.analyst.execute({
            "goal_prompt": clean_goal,
            "plan_data": planner_res.data,
            "research_data": researcher_res.data,
        })
        self._record_trace(execution_trace, self.analyst, analyst_res)
        total_tokens += analyst_res.tokens_used

        if analyst_res.status == AgentState.FAILED:
            return await self._handle_agent_failure(
                wf_id, clean_goal, title, start_perf, active_stage, analyst_res, agents_map, activity_events, execution_trace, persist
            )

        self._set_agent_state(
            agents_map,
            AgentRole.ANALYST,
            AgentState.COMPLETED,
            analyst_res.summary,
            progress=100,
            tokens=analyst_res.tokens_used,
            latency=analyst_res.latency_ms,
            output_snippet=analyst_res.output_text[:120],
        )
        add_event(AgentRole.ANALYST, self.analyst.name, analyst_res.summary, ActivityEventType.SYNTHESIS)

        # ── STAGE 4: WRITER ───────────────────────────────────────────
        active_stage = "Stage 4: Synthesis & Section Compilation"
        self._set_agent_state(agents_map, AgentRole.WRITER, AgentState.WORKING, "Compiling multi-section technical briefing")
        add_event(AgentRole.WRITER, self.writer.name, "Synthesizing research & quantitative metrics into structured report sections", ActivityEventType.DRAFT)

        writer_res = await self.writer.execute({
            "goal_prompt": clean_goal,
            "plan_data": planner_res.data,
            "research_data": researcher_res.data,
            "analysis_data": analyst_res.data,
        })
        self._record_trace(execution_trace, self.writer, writer_res)
        total_tokens += writer_res.tokens_used

        if writer_res.status == AgentState.FAILED:
            return await self._handle_agent_failure(
                wf_id, clean_goal, title, start_perf, active_stage, writer_res, agents_map, activity_events, execution_trace, persist
            )

        self._set_agent_state(
            agents_map,
            AgentRole.WRITER,
            AgentState.COMPLETED,
            writer_res.summary,
            progress=100,
            tokens=writer_res.tokens_used,
            latency=writer_res.latency_ms,
            output_snippet=writer_res.output_text[:120],
        )
        add_event(AgentRole.WRITER, self.writer.name, writer_res.summary, ActivityEventType.DRAFT)

        # ── STAGE 5: REVIEWER ─────────────────────────────────────────
        active_stage = "Stage 5: Verification & Fact Audit"
        self._set_agent_state(agents_map, AgentRole.REVIEWER, AgentState.WORKING, "Auditing draft against completeness and citation integrity")
        add_event(AgentRole.REVIEWER, self.reviewer.name, "Conducting critical fact audit and scoring document confidence", ActivityEventType.CRITIQUE)

        reviewer_res = await self.reviewer.execute({
            "goal_prompt": clean_goal,
            "report_text": writer_res.output_text,
            "writer_data": writer_res.data,
        })
        self._record_trace(execution_trace, self.reviewer, reviewer_res)
        total_tokens += reviewer_res.tokens_used

        if reviewer_res.status == AgentState.FAILED:
            return await self._handle_agent_failure(
                wf_id, clean_goal, title, start_perf, active_stage, reviewer_res, agents_map, activity_events, execution_trace, persist
            )

        self._set_agent_state(
            agents_map,
            AgentRole.REVIEWER,
            AgentState.COMPLETED,
            reviewer_res.summary,
            progress=100,
            tokens=reviewer_res.tokens_used,
            latency=reviewer_res.latency_ms,
            output_snippet=reviewer_res.output_text[:120],
        )
        add_event(AgentRole.REVIEWER, self.reviewer.name, reviewer_res.summary, ActivityEventType.CRITIQUE)

        # ── FINALIZATION & ARTIFACT COMPILATION ────────────────────────
        elapsed = time.perf_counter() - start_perf
        elapsed_str = self._format_elapsed(elapsed)
        confidence_score = float(reviewer_res.data.get("confidence_score", 0.0))
        is_approved = bool(reviewer_res.data.get("is_approved", False))

        raw_sections = reviewer_res.data.get("verified_sections") or writer_res.data.get("sections") or []
        typed_sections: list[TaskSection] = []
        for s in raw_sections:
            sec_status = SectionStatus(s.get("status", "drafted")) if s.get("status") in [e.value for e in SectionStatus] else SectionStatus.DRAFTED
            typed_sections.append(
                TaskSection(
                    heading=s.get("heading", "Untitled Section"),
                    content=s.get("content", ""),
                    contributor_role=AgentRole(s.get("contributorRole", "writer")),
                    status=sec_status,
                )
            )

        draft_artifact = DraftArtifact(
            title=writer_res.data.get("title", f"Investigation Report: {clean_goal[:45]}"),
            sections=typed_sections,
        )

        final_status = WorkflowStatus.COMPLETED
        active_stage = "Mission Completed"
        add_event(
            role=AgentRole.PLANNER,
            agent_name="Architect",
            message=f"Mission completed across 5 collaborative agents. Confidence: {confidence_score}%. Status: {'Certified' if is_approved else 'Flagged with notes'}.",
            event_type=ActivityEventType.SYSTEM,
        )

        response = WorkflowStatusResponse(
            id=wf_id,
            title=title,
            objective=clean_goal,
            status=final_status,
            active_stage=active_stage,
            elapsed_time=elapsed_str,
            total_tokens=total_tokens,
            confidence_score=confidence_score,
            draft_artifact=draft_artifact,
            agents=agents_map,
            activity_events=activity_events,
        )

        if persist:
            await self._persist_workflow(response, execution_trace, writer_res.output_text)

        return response

    async def _handle_agent_failure(
        self,
        wf_id: str,
        goal: str,
        title: str,
        start_perf: float,
        active_stage: str,
        failed_res: AgentExecutionResult,
        agents_map: dict[str, AgentWorkforceMember],
        activity_events: list[ActivityEvent],
        execution_trace: list[dict[str, Any]],
        persist: bool,
    ) -> WorkflowStatusResponse:
        """Safely record agent failure, update state, and return failed response."""
        elapsed = time.perf_counter() - start_perf
        elapsed_str = self._format_elapsed(elapsed)

        self._set_agent_state(
            agents_map,
            failed_res.role,
            AgentState.FAILED,
            failed_res.summary,
            progress=0,
            tokens=failed_res.tokens_used,
            latency=failed_res.latency_ms,
            output_snippet=failed_res.output_text[:120],
        )

        error_msg = f"Stage failure at {failed_res.role.value}: {failed_res.summary}"
        event = ActivityEvent(
            id=f"ev-{wf_id}-{len(activity_events) + 1}",
            timestamp=datetime.now(timezone.utc).strftime("%H:%M:%S"),
            agent_role=failed_res.role,
            agent_name=failed_res.role.value.capitalize(),
            message=error_msg,
            type=ActivityEventType.SYSTEM,
        )
        activity_events.append(event)

        failed_response = WorkflowStatusResponse(
            id=wf_id,
            title=title,
            objective=goal,
            status=WorkflowStatus.FAILED,
            active_stage=f"Failed at {failed_res.role.value}",
            elapsed_time=elapsed_str,
            total_tokens=sum(t.get("tokens_used", 0) for t in execution_trace),
            confidence_score=0.0,
            draft_artifact=DraftArtifact(title=f"Failed: {title}", sections=[]),
            agents=agents_map,
            activity_events=activity_events,
        )

        if persist:
            await self._persist_workflow(failed_response, execution_trace, None)

        return failed_response

    async def _persist_workflow(
        self,
        response: WorkflowStatusResponse,
        execution_trace: list[dict[str, Any]],
        markdown_content: Optional[str],
    ) -> None:
        """Persist workflow record and linked artifact in the database."""
        try:
            async with self.session_factory() as session:
                wf_record = WorkflowRecord(
                    id=response.id,
                    title=response.title,
                    goal_prompt=response.objective,
                    status=response.status.value,
                    active_stage=response.active_stage,
                    elapsed_time=response.elapsed_time,
                    total_tokens=response.total_tokens,
                    confidence_score=response.confidence_score,
                    agents_state_json={k: v.model_dump(by_alias=True) for k, v in (response.agents or {}).items()},
                    activity_events_json=[e.model_dump(by_alias=True) for e in (response.activity_events or [])],
                    completed_at=datetime.now(timezone.utc) if response.status in (WorkflowStatus.COMPLETED, WorkflowStatus.FAILED) else None,
                )
                session.add(wf_record)
                await session.flush()

                if response.draft_artifact and response.draft_artifact.sections:
                    is_synthetic = any(t.get("is_fallback", False) for t in execution_trace)
                    artifact_record = ArtifactRecord(
                        id=f"art-{response.id}",
                        workflow_id=response.id,
                        title=response.draft_artifact.title,
                        sections_json=[s.model_dump(by_alias=True) for s in response.draft_artifact.sections],
                        markdown_content=markdown_content or "",
                        verified_status="verified" if (response.confidence_score >= 75.0 and not is_synthetic) else "pending",
                    )
                    session.add(artifact_record)

                await session.commit()
                logger.info("Successfully persisted workflow %s to database", response.id)
        except Exception as err:
            logger.error("Failed to persist workflow %s: %s", response.id, str(err), exc_info=True)

    def _set_agent_state(
        self,
        agents_map: dict[str, AgentWorkforceMember],
        role: AgentRole,
        state: AgentState,
        description: str,
        progress: int = 0,
        tokens: int = 0,
        latency: int = 0,
        output_snippet: Optional[str] = None,
    ) -> None:
        """Update an agent's reactive state representation."""
        if role.value in agents_map:
            member = agents_map[role.value]
            member.state = state
            member.state_description = description
            member.progress_percent = progress
            if tokens:
                member.tokens_processed += tokens
            if latency:
                member.latency_ms = latency
            if output_snippet:
                member.output_snippet = output_snippet

    def _record_trace(
        self,
        trace: list[dict[str, Any]],
        agent: BaseAgent,
        res: AgentExecutionResult,
    ) -> None:
        """Record an immutable execution step into the audit trace."""
        trace.append({
            "agent_role": agent.role.value,
            "agent_name": agent.name,
            "codename": agent.codename,
            "status": res.status.value,
            "summary": res.summary,
            "latency_ms": res.latency_ms,
            "tokens_used": res.tokens_used,
            "provenance": res.provenance,
            "is_fallback": res.is_fallback,
            "data_keys": list(res.data.keys()),
        })

    def _format_elapsed(self, seconds: float) -> str:
        """Format floating-point elapsed seconds as MMm SSs."""
        mins = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{mins:02d}m {secs:02d}s"
