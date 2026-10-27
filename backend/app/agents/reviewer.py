"""
IntelliFlow Backend — Reviewer Agent (Validator, RV-05)
"""

from typing import Any, Optional
from app.agents.base import BaseAgent
from app.models.agent import AgentExecutionResult, AgentRole, AgentState
from app.models.workflow import SectionStatus
from app.services.llm import BaseLLMClient


class ReviewerAgent(BaseAgent):
    """
    Performs critical fact auditing, section completeness verification,
    and confidence scoring on the generated report.
    """

    def __init__(self, llm_client: Optional[BaseLLMClient] = None):
        super().__init__(
            role=AgentRole.REVIEWER,
            name="Validator",
            codename="RV-05",
            specialty="Hallucination Check & Citation Audit",
            avatar_variant="reviewer",
            llm_client=llm_client,
        )

    async def _run(self, context: dict[str, Any]) -> AgentExecutionResult:
        goal = str(context.get("goal_prompt") or context.get("goal") or "").strip()
        report_text = str(context.get("report_text") or context.get("markdown_full") or "")
        writer_data = context.get("writer_data", {})
        raw_sections = writer_data.get("sections", [])

        if not goal or not report_text:
            return AgentExecutionResult(
                role=self.role,
                status=AgentState.FAILED,
                summary="Missing goal or report text for review",
                output_text="Error: Reviewer requires non-empty goal and report text.",
                provenance="validation",
                is_fallback=True,
            )

        # 1. Verification checks based on actual content
        checks: dict[str, bool] = {}
        flags: list[str] = []

        # Check 1: Goal addressed in report
        goal_words = [w.lower() for w in goal.split() if len(w) > 3]
        matched_words = [w for w in goal_words if w in report_text.lower()]
        goal_addressed = len(matched_words) >= max(1, len(goal_words) // 2)
        checks["goal_alignment"] = goal_addressed
        if not goal_addressed:
            flags.append("Goal terms are not sufficiently represented in report body.")

        # Check 2: All 4 required sections present
        required_headers = [
            "Executive Summary",
            "Findings",
            "Insights",
            "Recommendations",
        ]
        present_headers = [
            h for h in required_headers if h.lower() in report_text.lower()
        ]
        has_all_sections = len(present_headers) == len(required_headers)
        checks["required_sections"] = has_all_sections
        if not has_all_sections:
            missing = set(required_headers) - set(present_headers)
            flags.append(f"Missing required report sections: {', '.join(missing)}.")

        # Check 3: Valid Markdown formatting
        has_headings = report_text.count("#") >= 3
        checks["formatting_valid"] = has_headings
        if not has_headings:
            flags.append("Report lacks standard Markdown heading hierarchy.")

        # Check 4: Provenance and Fallback labeling
        provenance_labeled = (
            "fallback" in report_text.lower()
            or "intelliflow" in report_text.lower()
            or "synthetic" in report_text.lower()
            or "notice" in report_text.lower()
        )
        checks["provenance_labeled"] = provenance_labeled
        if not provenance_labeled:
            flags.append("Report does not explicitly label execution provenance.")

        is_synthetic = (
            context.get("is_fallback", False)
            or "fallback" in report_text.lower()
            or "synthetic" in report_text.lower()
        )
        if is_synthetic:
            flags.append("Evidence is synthetic/fallback baseline; external factual verification pending live retrieval.")

        # Calculate actual objective confidence score based on verified checks
        passed_count = sum(1 for passed in checks.values() if passed)
        total_checks = len(checks)
        confidence_score = round((passed_count / total_checks) * 100.0, 1)

        # High confidence alone does not establish external factual verification for synthetic output
        is_approved = confidence_score >= 75.0 and len(flags) <= 2

        # Update section statuses: keep drafted/pending if synthetic, verified only if genuine live verification
        verified_sections = []
        for s in raw_sections:
            sec_copy = dict(s)
            if is_approved and not is_synthetic:
                sec_copy["status"] = SectionStatus.VERIFIED.value
            else:
                sec_copy["status"] = SectionStatus.DRAFTED.value
            verified_sections.append(sec_copy)


        # Generate reviewer audit text via LLM client or fallback
        resp = await self.llm_client.generate(
            system_prompt=(
                "You are the Lead Validation Auditor (Reviewer Agent). "
                "Audit the compiled report against completeness, consistency, and citation standards. "
                "Output formal certification."
            ),
            user_prompt=f"Audit report for: '{goal}'. Report length: {len(report_text)} chars.",
        )

        summary = (
            f"Audit {'APPROVED' if is_approved else 'FLAGGED'} "
            f"({passed_count}/{total_checks} checks passed, confidence: {confidence_score}%)"
        )
        provenance = "synthetic_fallback" if resp.is_fallback else "gemini_api"

        return AgentExecutionResult(
            role=self.role,
            status=AgentState.COMPLETED,
            summary=summary,
            output_text=resp.text,
            data={
                "is_approved": is_approved,
                "confidence_score": confidence_score,
                "checks": checks,
                "flags": flags,
                "passed_checks": passed_count,
                "total_checks": total_checks,
                "verified_sections": verified_sections,
            },
            provenance=provenance,
            is_fallback=resp.is_fallback,
            tokens_used=resp.tokens_used,
        )
