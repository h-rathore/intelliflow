"""
IntelliFlow Backend — Agent Implementation & Validation Tests
"""

import pytest

from app.agents import (
    PlannerAgent,
    ResearcherAgent,
    AnalystAgent,
    WriterAgent,
    ReviewerAgent,
)
from app.models.agent import AgentRole, AgentState


@pytest.fixture
def sample_goal() -> str:
    return "Research the impact of artificial intelligence on education and prepare a structured report."


@pytest.mark.asyncio
async def test_agent_instantiation():
    """Verify that all five specialized agents instantiate with their correct roles and metadata."""
    planner = PlannerAgent()
    researcher = ResearcherAgent()
    analyst = AnalystAgent()
    writer = WriterAgent()
    reviewer = ReviewerAgent()

    assert planner.role == AgentRole.PLANNER
    assert planner.name == "Architect"
    assert planner.codename == "PL-01"

    assert researcher.role == AgentRole.RESEARCHER
    assert researcher.name == "Scout"
    assert researcher.codename == "RS-02"

    assert analyst.role == AgentRole.ANALYST
    assert analyst.name == "Synthesizer"
    assert analyst.codename == "AN-03"

    assert writer.role == AgentRole.WRITER
    assert writer.name == "Scribe"
    assert writer.codename == "WR-04"

    assert reviewer.role == AgentRole.REVIEWER
    assert reviewer.name == "Validator"
    assert reviewer.codename == "RV-05"


@pytest.mark.asyncio
async def test_planner_agent_execution(sample_goal: str):
    """Verify PlannerAgent breaks down the user goal into structured subtasks."""
    planner = PlannerAgent()
    res = await planner.execute({"goal_prompt": sample_goal})

    assert res.role == AgentRole.PLANNER
    assert res.status == AgentState.COMPLETED
    assert len(res.output_text) > 50
    assert res.latency_ms >= 0
    assert "subtasks" in res.data
    assert len(res.data["subtasks"]) == 4

    # Verify first subtask assigns to researcher
    assert res.data["subtasks"][0]["target_agent"] == "researcher"


@pytest.mark.asyncio
async def test_researcher_agent_execution(sample_goal: str):
    """Verify ResearcherAgent produces findings with clearly labeled provenance."""
    researcher = ResearcherAgent()
    res = await researcher.execute({"goal_prompt": sample_goal})

    assert res.role == AgentRole.RESEARCHER
    assert res.status == AgentState.COMPLETED
    assert len(res.output_text) > 50
    assert "findings" in res.data
    assert res.data["findings_count"] == 4
    assert res.provenance in ("synthetic_fallback", "gemini_api")
    assert "evidence_type" in res.data


@pytest.mark.asyncio
async def test_analyst_agent_execution(sample_goal: str):
    """Verify AnalystAgent constructs comparative matrix without crashing."""
    analyst = AnalystAgent()
    res = await analyst.execute({
        "goal_prompt": sample_goal,
        "research_data": {"findings_count": 4},
    })

    assert res.role == AgentRole.ANALYST
    assert res.status == AgentState.COMPLETED
    assert len(res.output_text) > 50
    assert "metrics" in res.data
    assert res.data["dimensions_evaluated"] >= 4
    assert res.data["has_comparison_matrix"] is True


@pytest.mark.asyncio
async def test_writer_agent_execution(sample_goal: str):
    """Verify WriterAgent compiles structured Markdown with typed TaskSections."""
    writer = WriterAgent()
    res = await writer.execute({
        "goal_prompt": sample_goal,
        "research_data": {"findings_count": 4},
        "analysis_data": {"dimensions_evaluated": 4},
    })

    assert res.role == AgentRole.WRITER
    assert res.status == AgentState.COMPLETED
    assert len(res.output_text) > 100
    assert "sections" in res.data
    assert len(res.data["sections"]) == 4
    assert "markdown_full" in res.data

    # Verify first section is Executive Summary
    assert "Executive Summary" in res.data["sections"][0]["heading"]


@pytest.mark.asyncio
async def test_reviewer_agent_approved_report(sample_goal: str):
    """Verify ReviewerAgent validates and approves a complete, well-formed report."""
    writer = WriterAgent()
    writer_res = await writer.execute({"goal_prompt": sample_goal})

    reviewer = ReviewerAgent()
    res = await reviewer.execute({
        "goal_prompt": sample_goal,
        "report_text": writer_res.output_text,
        "writer_data": writer_res.data,
    })

    assert res.role == AgentRole.REVIEWER
    assert res.status == AgentState.COMPLETED
    assert res.data["is_approved"] is True
    assert res.data["confidence_score"] >= 75.0
    assert res.data["checks"]["required_sections"] is True
    assert res.data["checks"]["formatting_valid"] is True


@pytest.mark.asyncio
async def test_reviewer_agent_detects_incomplete_report():
    """Verify ReviewerAgent detects and flags missing sections in flawed input."""
    reviewer = ReviewerAgent()
    flawed_report = "# Short Note\nThis is just a quick unformatted comment."

    res = await reviewer.execute({
        "goal_prompt": "Research quantum cryptography",
        "report_text": flawed_report,
    })

    assert res.role == AgentRole.REVIEWER
    assert res.status == AgentState.COMPLETED
    assert res.data["is_approved"] is False
    assert res.data["checks"]["required_sections"] is False
    assert len(res.data["flags"]) > 0
    assert any("Missing required report sections" in f for f in res.data["flags"])


@pytest.mark.asyncio
async def test_agent_empty_goal_error_handling():
    """Verify agents handle empty goal inputs gracefully with FAILED status."""
    planner = PlannerAgent()
    res = await planner.execute({"goal_prompt": ""})

    assert res.role == AgentRole.PLANNER
    assert res.status == AgentState.FAILED
    assert "empty" in res.summary.lower()


@pytest.mark.asyncio
async def test_workforce_member_snapshot_generation():
    """Verify BaseAgent to_workforce_member generates accurate frontend representation."""
    planner = PlannerAgent()
    member = planner.to_workforce_member(
        state=AgentState.WORKING,
        state_description="Deconstructing goal into DAG",
        progress_percent=45,
        tokens_processed=320,
        latency_ms=150,
        current_thought="Evaluating sub-objectives",
    )

    assert member.id == "agent-planner"
    assert member.role == AgentRole.PLANNER
    assert member.state == AgentState.WORKING
    assert member.state_description == "Deconstructing goal into DAG"
    assert member.progress_percent == 45
    assert member.tokens_processed == 320
