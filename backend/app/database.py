"""
Solar ERP — Database Session Management
Async SQLAlchemy engine and session factory.
"""

import ssl
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()


def _build_engine_kwargs() -> dict:
    """Build engine kwargs, handling asyncpg SSL compatibility.

    asyncpg does not understand the libpq ``sslmode`` query parameter.
    If the DATABASE_URL contains ``?sslmode=require`` (common with Supabase),
    we strip it from the URL and pass ``ssl="require"`` via ``connect_args``
    instead.
    """
    url = settings.database_url
    connect_args: dict = {}

    parsed = urlparse(url)
    qs = parse_qs(parsed.query)

    if "sslmode" in qs:
        mode = qs.pop("sslmode")[0]  # e.g. "require"
        # Rebuild URL without sslmode
        new_query = urlencode(qs, doseq=True)
        url = urlunparse(parsed._replace(query=new_query))
        if mode == "require":
            # Create a default SSL context that doesn't verify certs
            # (Supabase pooler uses self-signed certs via transaction pooler)
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            connect_args["ssl"] = ctx

    return {"url": url, "connect_args": connect_args}


_engine_kwargs = _build_engine_kwargs()

engine = create_async_engine(
    _engine_kwargs["url"],
    echo=settings.debug,
    pool_pre_ping=True,
    pool_size=3,
    max_overflow=5,
    connect_args=_engine_kwargs["connect_args"],
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency: yield a database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
