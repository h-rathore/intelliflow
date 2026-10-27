"""
IntelliFlow Backend — Planner Agent (Architect, PL-01)
"""

from typing import Any, Optional
from app.agents.base import BaseAgent
from app.models.agent import AgentExecutionResult, AgentRole, AgentState
from app.services.llm import BaseLLMClient


class PlannerAgent(BaseAgent):
    """
    Deconstructs high-level user goals into structured subtasks
    and generates the execution plan for downstream agents.
    """

    def __init__(self, llm_client: Optional[BaseLLMClient] = None):
        super().__init__(
            role=AgentRole.PLANNER,
            name="Architect",
            codename="PL-01",
            specialty="DAG Deconstruction & Resource Routing",
            avatar_variant="planner",
            llm_client=llm_client,
        )

    async def _run(self, context: dict[str, Any]) -> AgentExecutionResult:
        goal = str(context.get("goal_prompt") or context.get("goal") or "").strip()
        if not goal:
            return AgentExecutionResult(
                role=self.role,
                status=AgentState.FAILED,
                summary="Goal prompt cannot be empty",
                output_text="Error: Planner received an empty or whitespace-only goal prompt.",
                data={"error": "EMPTY_GOAL"},
                provenance="validation",
                is_fallback=True,
                tokens_used=0,
            )

        system_prompt = (
            "You are the Lead Workflow Architect (Planner Agent). "
            "Your objective is to deconstruct complex user research goals into an observable execution DAG. "
            "Define 4 structured phases: 1) Domain Discovery, 2) Quantitative Benchmarking, "
            "3) Synthesis & Report Drafting, and 4) Fact Verification."
        )

        resp = await self.llm_client.generate(
            system_prompt=system_prompt,
            user_prompt=f"Goal: {goal}",
        )

        subtasks = [
            {
                "phase": 1,
                "title": "Domain Discovery & Literature Review",
                "target_agent": "researcher",
                "objective": f"Gather primary domain concepts and technical benchmarks for '{goal}'",
            },
            {
                "phase": 2,
                "title": "Comparative Capability & Quantitative Analysis",
                "target_agent": "analyst",
                "objective": "Cross-correlate baseline vs optimized metrics and compile capability matrix",
            },
            {
                "phase": 3,
                "title": "Technical Synthesis & Report Compilation",
                "target_agent": "writer",
                "objective": "Synthesize verified findings into a structured 4-section Markdown report",
            },
            {
                "phase": 4,
                "title": "Fact Audit & Citation Certification",
                "target_agent": "reviewer",
                "objective": "Verify citation consistency, score confidence, and certify publication readiness",
            },
        ]

        summary = f"Decomposed goal into {len(subtasks)} observable execution subtasks"
        provenance = "synthetic_fallback" if resp.is_fallback else "gemini_api"

        return AgentExecutionResult(
            role=self.role,
            status=AgentState.COMPLETED,
            summary=summary,
            output_text=resp.text,
            data={
                "goal": goal,
                "subtasks": subtasks,
                "phase_count": len(subtasks),
                "model": resp.model,
            },
            provenance=provenance,
            is_fallback=resp.is_fallback,
            tokens_used=resp.tokens_used,
        )
