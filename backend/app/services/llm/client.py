"""
IntelliFlow Backend — LLM Provider Client & Factory

Implements dual-mode model execution supporting Google Gemini API with seamless,
observable failover to the local DeterministicFallbackEngine.
"""

from abc import ABC, abstractmethod
from typing import Optional
import httpx

from app.core.config import settings
from app.core.logging import logger
from app.services.llm.fallback_engine import (
    DeterministicFallbackEngine,
    LLMResponse,
)


class LLMError(Exception):
    """Base exception for all LLM client failures."""
    pass


class LLMConfigurationError(LLMError):
    """Raised when provider configuration or credentials are missing."""
    pass


class LLMAuthenticationError(LLMError):
    """Raised when API credentials are rejected."""
    pass


class LLMRateLimitError(LLMError):
    """Raised when API quota or rate limits are exceeded."""
    pass


class LLMNetworkError(LLMError):
    """Raised on connection timeout or network level failure."""
    pass


class BaseLLMClient(ABC):
    """Abstract interface for LLM text generation."""

    @abstractmethod
    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        """Asynchronously generate text from system and user prompts."""
        pass


class GeminiLLMClient(BaseLLMClient):
    """
    Direct asynchronous HTTP client for Google Gemini REST API.
    Zero binary dependencies; utilizes installed httpx.
    """

    GEMINI_API_ENDPOINT = (
        "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    )

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = "gemini-1.5-flash",
        timeout_seconds: float = 30.0,
        fallback_on_error: bool = True,
    ):
        self.api_key = api_key or settings.gemini_api_key
        self.model_name = model_name
        self.timeout_seconds = timeout_seconds
        self.fallback_on_error = fallback_on_error
        self.fallback_engine = DeterministicFallbackEngine(model_name=f"{model_name}-fallback")

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        """Execute request against Gemini API with graceful error handling and observable fallback."""
        if not self.api_key or not self.api_key.strip():
            msg = "Gemini API key is not configured in settings or environment."
            logger.warning("%s Triggering deterministic fallback.", msg)
            if self.fallback_on_error:
                resp = await self.fallback_engine.generate(
                    system_prompt, user_prompt, temperature, max_tokens
                )
                resp.raw_error = "MISSING_GEMINI_API_KEY"
                return resp
            raise LLMConfigurationError(msg)

        endpoint = self.GEMINI_API_ENDPOINT.format(model=self.model_name)
        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"parts": [{"text": user_prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                res = await client.post(
                    endpoint,
                    params={"key": self.api_key},
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )

            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    raise LLMError("Gemini returned empty candidate list.")

                content_parts = candidates[0].get("content", {}).get("parts", [])
                text = "".join(part.get("text", "") for part in content_parts)
                tokens_used = data.get("usageMetadata", {}).get("totalTokenCount", len(text) // 4)

                return LLMResponse(
                    text=text,
                    model=self.model_name,
                    provider="gemini",
                    is_fallback=False,
                    tokens_used=tokens_used,
                )

            if res.status_code in (401, 403):
                raise LLMAuthenticationError(f"Gemini authentication failed (HTTP {res.status_code}): {res.text}")
            elif res.status_code == 429:
                raise LLMRateLimitError(f"Gemini rate limit or quota exceeded: {res.text}")
            else:
                raise LLMError(f"Gemini API returned HTTP {res.status_code}: {res.text}")

        except (LLMAuthenticationError, LLMRateLimitError, LLMError, httpx.RequestError) as err:
            logger.warning("Gemini API call failed (%s: %s).", type(err).__name__, str(err))
            if self.fallback_on_error:
                logger.info("Executing graceful failover to DeterministicFallbackEngine.")
                fallback_res = await self.fallback_engine.generate(
                    system_prompt, user_prompt, temperature, max_tokens
                )
                fallback_res.raw_error = f"{type(err).__name__}: {str(err)}"
                return fallback_res
            raise


def get_llm_client(
    provider: Optional[str] = None,
    fallback_on_error: bool = True,
) -> BaseLLMClient:
    """
    Factory function to obtain the configured LLM client.
    Defaults to settings.llm_provider ('mock_fallback' or 'gemini').
    """
    active_provider = (provider or settings.llm_provider).lower()

    if active_provider == "gemini":
        return GeminiLLMClient(
            api_key=settings.gemini_api_key,
            fallback_on_error=fallback_on_error,
        )

    return DeterministicFallbackEngine()
