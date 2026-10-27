"""
IntelliFlow Backend — Database Session & Engine Configuration
"""

from typing import AsyncGenerator, Optional
from sqlalchemy import event
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings
from app.db.models import Base

# Create default async engine from settings
engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
)

# Enable WAL mode for SQLite when using SQLite URLs
if "sqlite" in settings.database_url:
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()

# Async session factory
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db(target_engine: Optional[AsyncEngine] = None) -> None:
    """Initialize database tables idempotently."""
    db_engine = target_engine or engine
    async with db_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for yielding database sessions."""
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
