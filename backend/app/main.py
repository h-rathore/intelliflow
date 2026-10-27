"""
IntelliFlow Backend — Application Entry Point
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import settings
from app.core.logging import logger, setup_logging
from app.db import engine, init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup → yield → shutdown."""
    setup_logging(debug=settings.app_debug)
    logger.info(
        "Starting %s v%s [%s]",
        settings.app_name,
        settings.app_version,
        settings.app_env,
    )
    # Initialize database tables idempotently on startup
    await init_db()
    logger.info("Database initialized at %s", settings.database_url)
    yield
    await engine.dispose()
    logger.info("Shutting down %s", settings.app_name)



def create_app() -> FastAPI:
    """Application factory."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="AI-powered workflow automation and intelligence platform.",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────
    app.include_router(api_router, prefix="/api/v1")

    return app


app = create_app()
