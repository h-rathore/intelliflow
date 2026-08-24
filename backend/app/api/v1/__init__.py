"""
IntelliFlow Backend — API v1 Router Aggregator
"""

from fastapi import APIRouter

from app.api.v1 import health

api_router = APIRouter()

# ── Register sub-routers ──────────────────────────────────
api_router.include_router(health.router)
