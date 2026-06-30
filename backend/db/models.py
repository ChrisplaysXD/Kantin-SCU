"""
ORM models — SQLAlchemy declarative models targeting PostgreSQL.

On Postgres: tags column uses native ARRAY(String) with a GIN index
so queries like `menu_items.tags.overlap(["Chicken"])` hit the index
instead of doing a seq scan.

On SQLite (local dev): tags stored as JSON text, GIN index is skipped.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.types import JSON

from db.connection import engine


class Base(DeclarativeBase):
    pass


# pick the right column type depending on dialect
_using_postgres = engine.dialect.name == "postgresql"
_TagsColumnType = PG_ARRAY(String) if _using_postgres else JSON


class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    daily_calorie_target = Column(Integer, default=2000, nullable=False)
    daily_protein_target_g = Column(Integer, default=130, nullable=False)
    daily_fat_target_g = Column(Integer, default=65, nullable=False)

    orders = relationship("OrderRecord", back_populates="user", lazy="dynamic")


class MenuItem(Base):
    __tablename__ = "menu_items"

    item_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    canteen_name = Column(String, nullable=False, index=True)
    dish_name = Column(String, nullable=False)
    estimated_calories = Column(Integer, nullable=False, default=0)
    protein_g = Column(Integer, nullable=False, default=0)
    fat_g = Column(Integer, nullable=False, default=0)
    carbs_g = Column(Integer, nullable=False, default=0)
    health_score = Column(Integer, nullable=False, default=3)
    tags = Column(_TagsColumnType, nullable=False, default=list)

    orders = relationship("OrderRecord", back_populates="menu_item", lazy="dynamic")

    # GIN index on tags — only created on PostgreSQL
    if _using_postgres:
        __table_args__ = (
            Index("ix_menu_items_tags_gin", "tags", postgresql_using="gin"),
            Index("ix_menu_items_health_score", "health_score"),
        )
    else:
        __table_args__ = (
            Index("ix_menu_items_health_score", "health_score"),
        )


class OrderRecord(Base):
    __tablename__ = "order_history"

    order_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    item_id = Column(String, ForeignKey("menu_items.item_id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, default=func.now())

    user = relationship("User", back_populates="orders")
    menu_item = relationship("MenuItem", back_populates="orders")


def create_all_tables():
    """Create tables if they don't exist yet."""
    Base.metadata.create_all(engine)


def drop_all_tables():
    """Nuke everything — for test resets."""
    Base.metadata.drop_all(engine)
