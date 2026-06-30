"""
Module 2 — Daily Budget Tracking (database-backed)

Single aggregation query: JOINs order_history with menu_items,
filters by user + date, and SUMs all macros in one shot.
"""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from db.models import MenuItem, OrderRecord, User


def get_remaining_daily_budget(session: Session, user_id: str, current_date: date) -> dict:
    """
    Computes remaining daily macro budget with a single SQL query.
    Returns negative values if the user already went over.
    """
    user = session.get(User, user_id)
    if not user:
        raise ValueError(f"user {user_id} not found")

    # SUM macros for everything ordered today
    # use BETWEEN with day boundaries — works on both sqlite and postgres
    day_start = datetime.combine(current_date, datetime.min.time())
    day_end = datetime.combine(current_date, datetime.max.time())

    row = (
        session.query(
            func.coalesce(func.sum(MenuItem.estimated_calories), 0).label("cals"),
            func.coalesce(func.sum(MenuItem.protein_g), 0).label("protein"),
            func.coalesce(func.sum(MenuItem.fat_g), 0).label("fat"),
            func.coalesce(func.sum(MenuItem.carbs_g), 0).label("carbs"),
        )
        .join(OrderRecord, OrderRecord.item_id == MenuItem.item_id)
        .filter(
            OrderRecord.user_id == user_id,
            OrderRecord.timestamp >= day_start,
            OrderRecord.timestamp <= day_end,
        )
        .one()
    )

    consumed_cals = row.cals
    consumed_protein = row.protein
    consumed_fat = row.fat

    return {
        "remaining_calories": user.daily_calorie_target - consumed_cals,
        "remaining_protein_g": user.daily_protein_target_g - consumed_protein,
        "remaining_fat_g": user.daily_fat_target_g - consumed_fat,
        "remaining_carbs_g": -row.carbs,
        "consumed_calories": consumed_cals,
        "consumed_protein_g": consumed_protein,
        "consumed_fat_g": consumed_fat,
    }
