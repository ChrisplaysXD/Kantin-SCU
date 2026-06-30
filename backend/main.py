#!/usr/bin/env python3
"""
main.py — Canteen Recommendation Engine (SQLAlchemy / PostgreSQL)

Seeds test data via ORM, runs all 4 modules, prints JSON output.
Uses SQLite locally by default (set DATABASE_URL env for Postgres).
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta

from db.connection import get_session
from db.models import MenuItem, OrderRecord, User, create_all_tables, drop_all_tables
from modules.budget import get_remaining_daily_budget
from modules.enrichment import enrich_new_menu_item
from modules.recommender import get_personalized_recommendations


# ──────────────────────────────────────────────
#  SEED DATA
# ──────────────────────────────────────────────

def seed_users(session) -> list[User]:
    users = [
        User(user_id="user-a-001", daily_calorie_target=2000,
             daily_protein_target_g=130, daily_fat_target_g=65),
        User(user_id="user-b-002", daily_calorie_target=1800,
             daily_protein_target_g=120, daily_fat_target_g=55),
        User(user_id="user-c-003", daily_calorie_target=2200,
             daily_protein_target_g=140, daily_fat_target_g=70),
    ]
    session.add_all(users)
    session.flush()
    return users


def seed_menu(session) -> list[MenuItem]:
    items_raw = [
        ("item-01", "Main Canteen", "Chicken Katsu Curry Rice",
         780, 32, 35, 72, 2, ["Fried", "Chicken", "High-Fat", "Rice", "Japanese"]),
        ("item-02", "Main Canteen", "Nasi Goreng Spesial",
         650, 18, 22, 80, 2, ["Fried", "Rice", "Egg", "High-Fat"]),
        ("item-03", "Main Canteen", "Grilled Chicken Teriyaki Bowl",
         480, 35, 12, 55, 4, ["Grilled", "Chicken", "Rice", "Japanese", "High-Protein"]),
        ("item-04", "Main Canteen", "Mie Ayam Bakso",
         520, 22, 14, 68, 3, ["Noodle", "Chicken"]),

        ("item-05", "Science Faculty Hub", "Fresh Salmon Poke Bowl",
         420, 30, 14, 45, 5, ["Raw", "Fish", "Rice", "High-Protein", "Low-Cal"]),
        ("item-06", "Science Faculty Hub", "Tofu Veggie Salad",
         310, 16, 9, 32, 5, ["Raw", "Tofu", "Low-Cal"]),
        ("item-07", "Science Faculty Hub", "Crispy Fried Fish & Chips",
         720, 26, 32, 65, 1, ["Fried", "Fish", "High-Fat"]),

        ("item-08", "Engineering Canteen", "Steamed Chicken Breast & Brown Rice",
         390, 40, 8, 42, 5, ["Steamed", "Chicken", "Rice", "High-Protein"]),
        ("item-09", "Engineering Canteen", "Beef Rendang with White Rice",
         700, 33, 30, 70, 2, ["Beef", "Rice", "High-Fat"]),
        ("item-10", "Engineering Canteen", "Grilled Tofu Teriyaki Plate",
         360, 22, 10, 40, 4, ["Grilled", "Tofu", "Japanese"]),
    ]

    items = []
    for row in items_raw:
        m = MenuItem(
            item_id=row[0], canteen_name=row[1], dish_name=row[2],
            estimated_calories=row[3], protein_g=row[4], fat_g=row[5],
            carbs_g=row[6], health_score=row[7], tags=list(row[8]),
        )
        items.append(m)
    session.add_all(items)
    session.flush()
    return items


def seed_orders(session, users: list[User]):
    now = datetime.now()
    today_morning = now.replace(hour=8, minute=0, second=0)
    today_lunch = now.replace(hour=12, minute=30, second=0)

    def days_ago(n: int) -> datetime:
        return now - timedelta(days=n)

    orders = []

    # user_a: katsu habit, ate lunch today
    for d in range(0, 25, 3):
        orders.append(OrderRecord(user_id="user-a-001", item_id="item-01", timestamp=days_ago(d)))
    for d in range(1, 20, 4):
        orders.append(OrderRecord(user_id="user-a-001", item_id="item-02", timestamp=days_ago(d)))
    for d in range(5, 28, 7):
        orders.append(OrderRecord(user_id="user-a-001", item_id="item-04", timestamp=days_ago(d)))
    orders.append(OrderRecord(user_id="user-a-001", item_id="item-01", timestamp=today_lunch))

    # user_b: katsu + rendang, already blew budget today
    for d in range(0, 20, 2):
        orders.append(OrderRecord(user_id="user-b-002", item_id="item-01", timestamp=days_ago(d)))
    for d in range(2, 18, 3):
        orders.append(OrderRecord(user_id="user-b-002", item_id="item-09", timestamp=days_ago(d)))
    orders.append(OrderRecord(user_id="user-b-002", item_id="item-01", timestamp=today_morning))
    orders.append(OrderRecord(user_id="user-b-002", item_id="item-09", timestamp=today_lunch))

    # user_c: blank slate

    session.add_all(orders)
    session.flush()


# ──────────────────────────────────────────────
#  ENRICHMENT DEMO
# ──────────────────────────────────────────────

def demo_enrichment(session):
    print("=" * 60)
    print("  MODULE 1 — AI Enrichment Pipeline Demo")
    print("=" * 60)
    result = enrich_new_menu_item(
        session,
        "Crispy Salted Egg Chicken Katsu Rice Bowl",
        "Main Canteen",
    )
    print(json.dumps(result, indent=2))
    print()


# ──────────────────────────────────────────────
#  MAIN
# ──────────────────────────────────────────────

if __name__ == "__main__":
    drop_all_tables()
    create_all_tables()

    session = get_session()

    try:
        users = seed_users(session)
        seed_menu(session)
        seed_orders(session, users)
        session.commit()

        demo_enrichment(session)
        session.commit()

        print("=" * 60)
        print("  MODULE 2 + 3 + 4 — Recommendations per User")
        print("=" * 60)

        for user in users:
            print(f"\n{'─' * 50}")
            print(f"  User {user.user_id}")
            print(f"  Targets: {user.daily_calorie_target} cal / "
                  f"{user.daily_protein_target_g}g protein / "
                  f"{user.daily_fat_target_g}g fat")
            print(f"{'─' * 50}")

            try:
                payload = get_personalized_recommendations(session, user.user_id)
                print(json.dumps(payload, indent=2, default=str))
            except Exception as e:
                print(f"  [error] {e}")

        print()

    finally:
        session.close()
