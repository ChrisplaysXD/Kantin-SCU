"""
Database connection pool — production-grade SQLAlchemy setup targeting PostgreSQL.

Uses QueuePool with sane defaults for handling concurrent API requests.
Connection string pulled from DATABASE_URL env var, falls back to a local
SQLite for dev/testing so `python main.py` still works out of the box.
"""

from __future__ import annotations

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# grab from env, fallback to sqlite for local dev
_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///canteen_dev.db",
)

# postgres needs the right prefix for psycopg2/asyncpg
_is_postgres = _DATABASE_URL.startswith("postgres://")
if _is_postgres:
    _DATABASE_URL = _DATABASE_URL.replace("postgres://", "postgresql://", 1)


_pool_args = {}
if _DATABASE_URL.startswith("postgresql"):
    _pool_args = {
        "pool_size": 10,          # persistent connections kept open
        "max_overflow": 20,       # burst slots on top of pool_size
        "pool_timeout": 30,       # seconds to wait for a free conn
        "pool_recycle": 1800,     # recycle stale conns every 30 min
        "pool_pre_ping": True,    # test conn health before checkout
    }

engine = create_engine(
    _DATABASE_URL,
    echo=False,
    **_pool_args,
)

SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def get_session() -> Session:
    """
    Quick session factory for scripts / background jobs.
    For FastAPI or similar frameworks you'd wrap this in a
    dependency with try/finally or a context manager.
    """
    return SessionLocal()
