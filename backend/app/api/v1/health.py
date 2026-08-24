"""
IntelliFlow Backend — API v1: Health Router
"""

from fastapi import APIRouter

from app.core.config import settings
from app.models.health import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Returns the current operational status and version of the API.",
    tags=["System"],
)
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        version=settings.app_version,
        environment=settings.app_env,
    )
