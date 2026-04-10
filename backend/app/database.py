"""
Database connection and session management
"""

import asyncio
import sys

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool, QueuePool
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Fix Windows asyncio event loop for asyncpg compatibility
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


# SQLAlchemy Base
class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models"""
    pass


# PgBouncer (transaction mode) compatibility:
# asyncpg's prepare(name=None) converts to named=True internally, creating
# server-side named prepared statements that clash across PgBouncer connections.
# Fix: prepared_statement_name_func returns "" so asyncpg uses unnamed statements.

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DATABASE_ECHO,
    connect_args={
        "timeout": 30,
        "command_timeout": 30,
        "ssl": "prefer",
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        "prepared_statement_name_func": lambda: "",
    },
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=5,
    pool_pre_ping=True,
    pool_recycle=300,
    isolation_level="AUTOCOMMIT",
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# Dependency for DB session
async def get_db() -> AsyncSession:
    """
    Provides an AsyncSession. Engine uses AUTOCOMMIT isolation to reduce
    implicit transaction overhead from asyncpg.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database - create all tables"""
    async with engine.begin() as conn:
        # Import all models here to ensure they're registered
        from app.models import merchant, order, payment, webhook, idempotency, audit, api_key, payment_intent
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")


async def close_db():
    """Close database connections"""
    await engine.dispose()
    logger.info("Database connections closed")
