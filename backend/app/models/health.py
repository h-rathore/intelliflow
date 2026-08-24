"""
IntelliFlow Backend — Health Check Schemas
"""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Response model for the /health endpoint."""

    status: str
    version: str
    environment: str
