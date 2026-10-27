"""
IntelliFlow Backend — Base Agent Architecture
"""

from abc import ABC, abstractmethod
import time
from typing import Any, Optional

from app.core.logging import logger
from app.models.agent import (
    AgentExecutionResult,
    AgentRole,
    AgentState,
    AgentWorkforceMember,
)
from app.services.llm import BaseLLMClient, get_llm_client


class BaseAgent(ABC):
    """
    Abstract Base Agent encapsulating execution lifecycle,
    metric instrumentation, and error handling.
    """

    def __init__(
        self,
        role: AgentRole,
        name: str,
        codename: str,
        specialty: str,
        avatar_variant: str,
        llm_client: Optional[BaseLLMClient] = None,
    ):
        self.role = role
        self.name = name
        self.codename = codename
        self.specialty = specialty
        self.avatar_variant = avatar_variant
        self._llm_client = llm_client

    @property
    def llm_client(self) -> BaseLLMClient:
        """Lazily resolve LLM client if not explicitly injected."""
        if self._llm_client is None:
            self._llm_client = get_llm_client()
        return self._llm_client

    async def execute(self, context: dict[str, Any]) -> AgentExecutionResult:
        """
        Execute agent task with timing, logging, and fault isolation.
        """
        logger.info("Executing %s (%s) for role %s", self.name, self.codename, self.role.value)
        start_time = time.perf_counter()

        try:
            result = await self._run(context)
            elapsed_ms = int((time.perf_counter() - start_time) * 1000)
            result.latency_ms = elapsed_ms
            logger.info(
                "Completed %s (%s) in %dms with status %s",
                self.name,
                self.codename,
                elapsed_ms,
                result.status.value,
            )
            return result
        except Exception as err:
            elapsed_ms = int((time.perf_counter() - start_time) * 1000)
            logger.error("Error executing %s (%s): %s", self.name, self.codename, str(err), exc_info=True)
            return AgentExecutionResult(
                role=self.role,
                status=AgentState.FAILED,
                summary=f"Execution error: {type(err).__name__} - {str(err)}",
                output_text=f"Agent execution encountered an unhandled exception: {str(err)}",
                data={"error": str(err), "error_type": type(err).__name__},
                provenance="error",
                is_fallback=True,
                tokens_used=0,
                latency_ms=elapsed_ms,
            )

    @abstractmethod
    async def _run(self, context: dict[str, Any]) -> AgentExecutionResult:
        """Agent-specific execution logic to be implemented by subclasses."""
        pass

    def to_workforce_member(
        self,
        state: AgentState = AgentState.IDLE,
        state_description: str = "Ready",
        progress_percent: int = 0,
        tokens_processed: int = 0,
        latency_ms: int = 0,
        current_thought: Optional[str] = None,
        output_snippet: Optional[str] = None,
        active_tool: Optional[str] = None,
    ) -> AgentWorkforceMember:
        """Create a presentation snapshot matching frontend AgentWorkforceMember."""
        return AgentWorkforceMember(
            id=f"agent-{self.role.value}",
            role=self.role,
            name=self.name,
            codename=self.codename,
            specialty=self.specialty,
            state=state,
            state_description=state_description,
            active_tool=active_tool,
            current_thought=current_thought,
            output_snippet=output_snippet,
            progress_percent=progress_percent,
            tokens_processed=tokens_processed,
            latency_ms=latency_ms,
            avatar_variant=self.avatar_variant,
        )
