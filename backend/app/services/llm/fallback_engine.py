"""
IntelliFlow Backend — Deterministic Fallback Engine

Provides predictable, context-aware, reproducible text generation for offline
development, unit testing, and quota exhaustion fallback.
"""

import re
from dataclasses import dataclass
from typing import Optional


@dataclass
class LLMResponse:
    """Standardized response from an LLM provider."""
    text: str
    model: str
    provider: str
    is_fallback: bool
    tokens_used: int = 0
    raw_error: Optional[str] = None


class DeterministicFallbackEngine:
    """
    Deterministic rule-based response generator.
    Produces structured outputs aligned with IntelliFlow's 5 agent roles.
    """

    def __init__(self, model_name: str = "deterministic-fallback-v1"):
        self.model_name = model_name
        self.provider_name = "mock_fallback"

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        """Generate a deterministic response based on system role and input prompt."""
        clean_user = user_prompt.strip()
        clean_sys = system_prompt.lower()
        topic = self._extract_topic(clean_user)

        if re.search(r"\b(writer|scribe|technical writer)\b", clean_sys):
            output = self._writer_response(topic, clean_user)
        elif re.search(r"\b(reviewer|validator|auditor|critique)\b", clean_sys):
            output = self._reviewer_response(topic, clean_user)
        elif re.search(r"\b(analyst|synthesizer|quant)\b", clean_sys):
            output = self._analysis_response(topic, clean_user)
        elif re.search(r"\b(researcher|scout)\b", clean_sys):
            output = self._research_response(topic, clean_user)
        elif re.search(r"\b(planner|architect|dag planning)\b", clean_sys):
            output = self._plan_response(topic, clean_user)
        else:
            output = self._generic_response(topic, clean_user)


        # Estimate tokens deterministically (approx 4 chars per token)
        estimated_tokens = max(50, len(output) // 4)

        return LLMResponse(
            text=output,
            model=self.model_name,
            provider=self.provider_name,
            is_fallback=True,
            tokens_used=estimated_tokens,
        )

    def _extract_topic(self, prompt: str) -> str:
        """Extract a clean subject title from the user prompt."""
        cleaned = re.sub(
            r"^(research|analyze|investigate|evaluate|assess|prepare a report on|study)\s+",
            "",
            prompt,
            flags=re.IGNORECASE,
        ).strip()
        cleaned = cleaned.rstrip(".!?:")
        if not cleaned:
            return "Knowledge Domain"
        # Capitalize each word for headline formatting
        return " ".join(w.capitalize() for w in cleaned.split()[:8])

    def _plan_response(self, topic: str, user_prompt: str) -> str:
        return f"""### Workflow Execution Plan for: {topic}
Objective: Deconstruct natural language goal into observable execution DAG.

1. **Phase 1: Domain Discovery & Source Ingestion**
   - Agent: Researcher (Scout, RS-02)
   - Scope: Retrieve foundational literature, recent developments, and technical metrics for '{topic}'.
   - Deliverable: Verified source catalog with 4 primary references.

2. **Phase 2: Comparative & Quantitative Analysis**
   - Agent: Analyst (Synthesizer, AN-03)
   - Scope: Analyze collected datasets, extract performance indicators, and structure evaluation matrix.
   - Deliverable: Multi-attribute capability assessment table.

3. **Phase 3: Synthesis & Report Drafting**
   - Agent: Writer (Scribe, WR-04)
   - Scope: Synthesize findings into Executive Summary, Technical Architecture, and Strategic Recommendations.
   - Deliverable: Multi-section structured Markdown report.

4. **Phase 4: Verification & Certification**
   - Agent: Reviewer (Validator, RV-05)
   - Scope: Verify citation accuracy, check for unsupported assertions, and certify document readiness.
   - Deliverable: Audited artifact with confidence score.

*Mode: Deterministic Fallback (Offline Evaluation Engine)*"""

    def _research_response(self, topic: str, user_prompt: str) -> str:
        return f"""### Research Findings: {topic}
*Context Source: IntelliFlow Fallback Knowledge Engine (Synthetic Baseline for Testing)*

1. **Foundational Concept & Baseline**
   - Primary domain encompasses core methodologies, operational architectures, and recent paradigms in {topic}.
   - Key challenge identified: balancing throughput, algorithmic precision, and implementation overhead.

2. **Observed Industry & Academic Patterns**
   - Rapid adoption of modular, component-based architectures across enterprise workflows.
   - Increasing reliance on observable instrumentation and deterministic verification gates.

3. **Technical Benchmarks & References**
   - Reference [REF-01]: Core Architectural Standard (IEEE/ACM 2025 Consensus).
   - Reference [REF-02]: Performance and Latency Metrics Across Distributed Implementations.
   - Reference [REF-03]: Empirical Evaluation of Multi-Agent Knowledge Synthesis.
   - Reference [REF-04]: Safety, Citation Integrity, and Verification Protocols.

*Status: 4 primary references compiled. Transmitted to Synthesizer for quantitative correlation.*"""

    def _analysis_response(self, topic: str, user_prompt: str) -> str:
        return f"""### Quantitative Capability & Architecture Matrix: {topic}

| Dimension | Baseline Standard | Optimized Architecture | Delta / Impact |
|:---|:---|:---|:---|
| **Coordination Latency** | 420 ms | 115 ms | +72.6% efficiency |
| **Information Precision** | 81.4% | 96.8% | +15.4% accuracy |
| **Schema Validation** | Manual / Ad-hoc | Automated Pydantic v2 | 100% contract compliance |
| **Fault Tolerance** | Single Point of Failure | Multi-Agent Isolated DAG | Zero cascade crashes |

**Synthesis Summary:**
- Analysis indicates that decomposing '{topic}' into discrete agent stages yields significant improvements in verification and observability over monolithic pipelines.
- Recommended focus areas: structured state propagation and citation integrity checks.

*Status: Quantitative correlation complete. Dispatched to Scribe for report compilation.*"""

    def _writer_response(self, topic: str, user_prompt: str) -> str:
        return f"""# Investigation Report: {topic}

## 1. Executive Summary
This investigation analyzes the operational landscape, methodological foundations, and architectural requirements of **{topic}**. By decomposing complex objectives into structured subtasks, intelligent orchestration frameworks enable reproducible knowledge processing, observable agent coordination, and verifiable final outputs.

## 2. Technical Findings & Architectural Breakdown
Analysis of domain literature and empirical baselines reveals three primary operational components:
- **Task Deconstruction:** Natural language intents are parsed into structured Directed Acyclic Graphs (DAGs) rather than unconstrained prompt loops.
- **Concurrent Processing:** Information discovery and quantitative benchmarking execute in parallel stages to minimize end-to-end wall-clock latency.
- **Relational Persistence:** Every state transition, agent thought, and intermediate finding is persistently captured in relational storage for auditability.

## 3. Quantitative Insights & Comparative Evaluation
Experimental comparisons indicate that modular agent specialization achieves a 15.4% improvement in output coherence compared to single-pass LLM prompts. By separating research gathering from critical review, hallucination risks are systematically mitigated.

## 4. Strategic Recommendations
1. Establish automated verification gates prior to final artifact export.
2. Maintain strict decoupling between orchestration scheduling and individual agent execution.
3. Integrate dual-mode provider failovers to ensure zero downtime during third-party API rate limiting.

---
*> Notice: Generated via IntelliFlow Deterministic Fallback Engine for offline development & mid-term testing.*"""

    def _reviewer_response(self, topic: str, user_prompt: str) -> str:
        return f"""### Verification Audit & Certification: {topic}
Auditor: Reviewer Agent (Validator, RV-05)

- **Structural Completeness:** PASS (4/4 required sections present: Summary, Findings, Insights, Recommendations).
- **Citation Integrity:** PASS (All referenced benchmarks cross-correlated with domain findings).
- **Formatting Compliance:** PASS (Valid GFM Markdown syntax, structured comparison tables).
- **Hallucination Risk Score:** 0.02 (Negligible).
- **Overall Confidence Score:** 98.4%

**Certification Outcome:** APPROVED for publication and export.
*Audit Log: Fully verified against schema standards.*"""

    def _generic_response(self, topic: str, user_prompt: str) -> str:
        return f"""### IntelliFlow Analysis: {topic}

Processed Request: "{user_prompt}"

1. **Analysis Overview:** Evaluated task constraints and identified core requirements for {topic}.
2. **System State:** Pipeline initialized; structured outputs generated under deterministic baseline rules.
3. **Execution Mode:** Offline Fallback Engine (no external LLM API quota consumed).

*Status: Ready for downstream stage consumption.*"""
