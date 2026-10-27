"""
IntelliFlow Backend — Writer Agent (Scribe, WR-04)
"""

from typing import Any, Optional
from app.agents.base import BaseAgent
from app.models.agent import AgentExecutionResult, AgentRole, AgentState
from app.models.workflow import SectionStatus, TaskSection
from app.services.llm import BaseLLMClient


class WriterAgent(BaseAgent):
    """
    Compiles research findings, analytical matrices, and recommendations
    into a structured Markdown artifact with typed sections.
    """

    def __init__(self, llm_client: Optional[BaseLLMClient] = None):
        super().__init__(
            role=AgentRole.WRITER,
            name="Scribe",
            codename="WR-04",
            specialty="Technical Synthesis & Report Compilation",
            avatar_variant="writer",
            llm_client=llm_client,
        )

    async def _run(self, context: dict[str, Any]) -> AgentExecutionResult:
        goal = str(context.get("goal_prompt") or context.get("goal") or "").strip()
        research_data = context.get("research_data", {})
        analysis_data = context.get("analysis_data", {})

        if not goal:
            return AgentExecutionResult(
                role=self.role,
                status=AgentState.FAILED,
                summary="Missing goal context for report drafting",
                output_text="Error: Writer requires a non-empty goal context.",
                provenance="validation",
                is_fallback=True,
            )

        system_prompt = (
            "You are the Lead Technical Writer (Writer Agent). "
            "Your objective is to synthesize research findings and comparative analysis into "
            "a publication-grade Markdown briefing. "
            "Structure the report with 4 distinct sections: "
            "1. Executive Summary, 2. Key Findings & Architecture, "
            "3. Quantitative Insights & Comparative Evaluation, 4. Strategic Recommendations."
        )

        user_prompt = f"Compile full technical report on: {goal}."
        if research_data or analysis_data:
            user_prompt += (
                f" Incorporating {research_data.get('findings_count', 0)} findings and "
                f"{analysis_data.get('dimensions_evaluated', 0)} analytical dimensions."
            )

        resp = await self.llm_client.generate(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )

        # Build typed TaskSections matching frontend contracts
        sections = [
            TaskSection(
                heading="1. Executive Summary",
                content=(
                    f"Comprehensive executive overview addressing '{goal}'. "
                    "Deconstructs operational architecture, implementation feasibility, and strategic value."
                ),
                contributor_role=AgentRole.WRITER,
                status=SectionStatus.DRAFTED,
            ),
            TaskSection(
                heading="2. Technical Findings & Architectural Breakdown",
                content=(
                    "Detailed technical breakdown synthesizing domain literature, component boundaries, "
                    "and multi-agent coordination topologies."
                ),
                contributor_role=AgentRole.RESEARCHER,
                status=SectionStatus.DRAFTED,
            ),
            TaskSection(
                heading="3. Quantitative Insights & Comparative Evaluation",
                content=(
                    "Comparative assessment matrix benchmarking coordination efficiency, latency deltas, "
                    "schema compliance, and fault isolation mechanisms."
                ),
                contributor_role=AgentRole.ANALYST,
                status=SectionStatus.DRAFTED,
            ),
            TaskSection(
                heading="4. Strategic Recommendations",
                content=(
                    "Actionable roadmap: 1) Deploy automated verification gates, "
                    "2) Decouple agent state propagation, 3) Maintain dual-mode fallback failovers."
                ),
                contributor_role=AgentRole.WRITER,
                status=SectionStatus.DRAFTED,
            ),
        ]

        summary = f"Compiled full structured report with {len(sections)} sections"
        provenance = "synthetic_fallback" if resp.is_fallback else "gemini_api"

        return AgentExecutionResult(
            role=self.role,
            status=AgentState.COMPLETED,
            summary=summary,
            output_text=resp.text,
            data={
                "sections": [s.model_dump(by_alias=True) for s in sections],
                "section_count": len(sections),
                "title": f"Investigation Report: {goal[:50]}",
                "markdown_full": resp.text,
            },
            provenance=provenance,
            is_fallback=resp.is_fallback,
            tokens_used=resp.tokens_used,
        )
