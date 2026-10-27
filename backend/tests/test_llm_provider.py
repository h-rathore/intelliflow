"""
IntelliFlow Backend — LLM Provider & Fallback Tests
"""

from unittest.mock import AsyncMock, patch
import httpx
import pytest

from app.services.llm.client import (
    GeminiLLMClient,
    LLMConfigurationError,
    get_llm_client,
)
from app.services.llm.fallback_engine import DeterministicFallbackEngine


@pytest.mark.asyncio
async def test_fallback_generation_returns_non_empty_output():
    """Verify fallback engine returns structured, non-empty response with metadata."""
    engine = DeterministicFallbackEngine()
    resp = await engine.generate(
        system_prompt="You are an expert researcher.",
        user_prompt="Evaluate quantum key distribution protocols.",
    )
    assert resp.text is not None
    assert len(resp.text) > 100
    assert resp.is_fallback is True
    assert resp.provider == "mock_fallback"
    assert resp.tokens_used > 0
    assert "Quantum Key Distribution Protocols" in resp.text


@pytest.mark.asyncio
async def test_fallback_output_is_deterministic():
    """Verify fallback engine produces 100% identical outputs for identical inputs."""
    engine = DeterministicFallbackEngine()
    prompt = "Assess serverless container cold-start latencies"
    sys_prompt = "You are an analyst comparing architecture trade-offs."

    resp1 = await engine.generate(sys_prompt, prompt)
    resp2 = await engine.generate(sys_prompt, prompt)

    assert resp1.text == resp2.text
    assert resp1.tokens_used == resp2.tokens_used
    assert resp1.model == resp2.model


@pytest.mark.asyncio
async def test_fallback_agent_role_specialization():
    """Verify fallback engine tailors outputs according to agent roles."""
    engine = DeterministicFallbackEngine()
    topic = "Autonomous Microgrid Energy Management"

    # Planner
    plan = await engine.generate("You are the planner agent.", topic)
    assert "Workflow Execution Plan" in plan.text
    assert "Phase 1:" in plan.text

    # Analyst
    analysis = await engine.generate("You are the analyst synthesizer.", topic)
    assert "Capability & Architecture Matrix" in analysis.text
    assert "| Dimension |" in analysis.text

    # Writer
    report = await engine.generate("You are the writer agent.", topic)
    assert "# Investigation Report:" in report.text
    assert "## 1. Executive Summary" in report.text

    # Reviewer
    review = await engine.generate("You are the reviewer validator.", topic)
    assert "Verification Audit & Certification:" in review.text
    assert "Overall Confidence Score:" in review.text


def test_provider_selection_mock_fallback():
    """Verify factory returns DeterministicFallbackEngine when configured."""
    client = get_llm_client(provider="mock_fallback")
    assert isinstance(client, DeterministicFallbackEngine)
    assert client.provider_name == "mock_fallback"


@pytest.mark.asyncio
async def test_missing_gemini_credentials_controlled_fallback():
    """Verify missing Gemini credentials trigger controlled fallback without crashing."""
    client = GeminiLLMClient(api_key=None, fallback_on_error=True)
    resp = await client.generate(
        system_prompt="You are a researcher.",
        user_prompt="Investigate edge computing.",
    )
    assert resp.is_fallback is True
    assert resp.raw_error == "MISSING_GEMINI_API_KEY"
    assert len(resp.text) > 50


@pytest.mark.asyncio
async def test_missing_gemini_credentials_raises_when_no_fallback():
    """Verify missing Gemini credentials raise error when fallback is disabled."""
    client = GeminiLLMClient(api_key=None, fallback_on_error=False)
    with pytest.raises(LLMConfigurationError, match="Gemini API key is not configured"):
        await client.generate("You are a planner", "Plan task")


@pytest.mark.asyncio
async def test_gemini_mocked_network_success():
    """Verify Gemini client correctly parses successful API JSON responses."""
    client = GeminiLLMClient(api_key="test-api-key-123", fallback_on_error=False)

    mock_gemini_payload = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": "Synthetic Gemini analysis content."}],
                    "role": "model",
                },
                "finishReason": "STOP",
            }
        ],
        "usageMetadata": {
            "promptTokenCount": 25,
            "candidatesTokenCount": 40,
            "totalTokenCount": 65,
        },
    }

    mock_response = AsyncMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.json = lambda: mock_gemini_payload

    with patch("httpx.AsyncClient.post", return_value=mock_response):
        resp = await client.generate("System instruction", "User query")

    assert resp.text == "Synthetic Gemini analysis content."
    assert resp.provider == "gemini"
    assert resp.is_fallback is False
    assert resp.tokens_used == 65


@pytest.mark.asyncio
async def test_gemini_mocked_network_failure_failover():
    """Verify Gemini client fails over gracefully to fallback engine on network error."""
    client = GeminiLLMClient(api_key="test-api-key-123", fallback_on_error=True)

    with patch("httpx.AsyncClient.post", side_effect=httpx.ConnectTimeout("Network timed out")):
        resp = await client.generate("You are a researcher", "Analyze cloud databases")

    assert resp.is_fallback is True
    assert "ConnectTimeout" in resp.raw_error
    assert len(resp.text) > 50
    assert "Cloud Databases" in resp.text
