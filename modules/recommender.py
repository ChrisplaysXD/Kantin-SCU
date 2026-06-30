"""
Module 3 — Dual-Track Recommendation Engine (database-backed)

All heavy lifting pushed to SQL. Python only does the
cross-canteen rebalancing on the small result set that
comes back from the DB.

Track 1  →  frequent_favorites   (SQL GROUP BY + ORDER BY count)
Track 2  →  healthy_alternatives (SQL WHERE with tag/cal/fat filters)
"""

from __future__ import annotations

from datetime import date, datetime, timedelta

from sqlalchemy import and_, case, cast, func, not_, Date
from sqlalchemy.orm import Session

from db.connection import engine
from db.models import MenuItem, OrderRecord, User
from modules.budget import get_remaining_daily_budget
from modules.copywriter import generate_recommendation_card


# --- tunable thresholds ---
_LOW_CAL_THRESHOLD = 600
_LOW_FAT_THRESHOLD = 15
_HEALTHY_SCORE_MIN = 4
_FAVORITES_LIMIT = 3
_ALTERNATIVES_LIMIT = 5
_LOOKBACK_DAYS = 30

_BAD_TAGS = ["Fried", "High-Fat"]
_using_postgres = engine.dialect.name == "postgresql"


# ──────────────────────────────────────────────
#  Track 1 — Frequent Favorites
# ──────────────────────────────────────────────

def _get_frequent_favorites(session: Session, user_id: str) -> list[dict]:
    """
    SELECT item_id, count(*) as cnt, dish_name, canteen_name
    FROM order_history JOIN menu_items ...
    WHERE user_id = :uid AND timestamp >= :cutoff
    GROUP BY item_id
    ORDER BY cnt DESC
    LIMIT 3
    """
    cutoff = datetime.now() - timedelta(days=_LOOKBACK_DAYS)

    rows = (
        session.query(
            OrderRecord.item_id,
            func.count(OrderRecord.order_id).label("cnt"),
            MenuItem.dish_name,
            MenuItem.canteen_name,
        )
        .join(MenuItem, MenuItem.item_id == OrderRecord.item_id)
        .filter(
            OrderRecord.user_id == user_id,
            OrderRecord.timestamp >= cutoff,
        )
        .group_by(
            OrderRecord.item_id,
            MenuItem.dish_name,
            MenuItem.canteen_name,
        )
        .order_by(func.count(OrderRecord.order_id).desc())
        .limit(_FAVORITES_LIMIT)
        .all()
    )

    return [
        {
            "item_id": r.item_id,
            "dish_name": r.dish_name,
            "canteen_name": r.canteen_name,
            "order_count": r.cnt,
        }
        for r in rows
    ]


# ──────────────────────────────────────────────
#  Helpers — dominant tags & home canteen
# ──────────────────────────────────────────────

def _get_dominant_tags(session: Session, fav_ids: list[str]) -> list[str]:
    """Pull the union of tags from the user's favorite items."""
    if not fav_ids:
        return []

    rows = (
        session.query(MenuItem.tags)
        .filter(MenuItem.item_id.in_(fav_ids))
        .all()
    )

    all_tags: set[str] = set()
    for (tags,) in rows:
        if tags:
            all_tags.update(tags)
    return list(all_tags)


def _get_home_canteen(session: Session, user_id: str) -> str | None:
    """Most frequently visited canteen across all time."""
    row = (
        session.query(
            MenuItem.canteen_name,
            func.count(OrderRecord.order_id).label("cnt"),
        )
        .join(OrderRecord, OrderRecord.item_id == MenuItem.item_id)
        .filter(OrderRecord.user_id == user_id)
        .group_by(MenuItem.canteen_name)
        .order_by(func.count(OrderRecord.order_id).desc())
        .limit(1)
        .first()
    )
    return row.canteen_name if row else None


# ──────────────────────────────────────────────
#  Track 2 — Healthy Alternatives (DB-level filter)
# ──────────────────────────────────────────────

def _query_healthy_candidates(
    session: Session,
    exclude_ids: list[str],
    fav_tags: list[str],
    budget: dict,
    budget_tight: bool,
    *,
    strict: bool = True,
) -> list[dict]:
    """
    Builds a single SQL query that filters menu items by health
    criteria and scores them by (health_score * 10 + tag_overlap).

    On PostgreSQL the tag overlap uses array operators that hit the
    GIN index. On SQLite we fall back to pulling tags as JSON and
    computing overlap in Python on the small result set.

    strict=True  → also enforce cal/fat ceiling (first pass)
    strict=False → just exclude bad tags (fallback when overbudget)
    """

    # tag overlap scoring — postgres can do this natively
    if _using_postgres and fav_tags:
        # cardinality(array_intersect) isn't standard, but we can
        # use a subquery or just grab a generous set and re-rank
        # in Python on the small output. The WHERE clause is what
        # matters for perf — that's where the GIN index shines.
        pass

    q = session.query(MenuItem).filter(MenuItem.item_id.notin_(exclude_ids))

    if budget_tight:
        # exclude items tagged with Fried / High-Fat
        if _using_postgres:
            # NOT tags && ARRAY['Fried','High-Fat']  (overlap operator)
            q = q.filter(not_(MenuItem.tags.overlap(_BAD_TAGS)))
        else:
            # sqlite fallback: brute filter in Python after query
            pass

        if strict:
            cal_cap = max(budget["remaining_calories"], 0)
            fat_cap = max(budget["remaining_fat_g"], 0)
            q = q.filter(
                MenuItem.estimated_calories <= cal_cap,
                MenuItem.fat_g <= fat_cap,
            )
    else:
        q = q.filter(MenuItem.health_score >= _HEALTHY_SCORE_MIN)

    # sort by health_score desc, then lowest cal as tiebreaker
    q = q.order_by(MenuItem.health_score.desc(), MenuItem.estimated_calories.asc())

    # grab more than we need so the canteen-nudge pass has room
    raw = q.limit(_ALTERNATIVES_LIMIT * 3).all()

    # sqlite fallback: filter out bad tags in Python
    if not _using_postgres and budget_tight:
        raw = [
            item for item in raw
            if not set(item.tags or []) & set(_BAD_TAGS)
        ]

    fav_tag_set = set(fav_tags)

    results = []
    for item in raw:
        item_tags = set(item.tags or [])
        tag_overlap = len(fav_tag_set & item_tags)

        # composite rank — health first, tag relevance second
        rank = item.health_score * 10 + tag_overlap
        if not strict:
            rank -= item.estimated_calories * 0.01

        results.append((rank, {
            "item_id": item.item_id,
            "dish_name": item.dish_name,
            "canteen_name": item.canteen_name,
            "health_score": item.health_score,
            "estimated_calories": item.estimated_calories,
            "tags": list(item.tags or []),
        }))

    results.sort(key=lambda x: x[0], reverse=True)
    return results


def _apply_canteen_nudge(
    scored: list[tuple[float, dict]],
    home_canteen: str | None,
) -> list[dict]:
    """Enforce >=50% from non-home canteens."""
    other = [s for s in scored if s[1]["canteen_name"] != home_canteen]
    same = [s for s in scored if s[1]["canteen_name"] == home_canteen]

    half = _ALTERNATIVES_LIMIT // 2 + 1
    picked: list[dict] = [s[1] for s in other[:half]]
    remaining = _ALTERNATIVES_LIMIT - len(picked)
    picked.extend(s[1] for s in same[:remaining])

    already = {p["item_id"] for p in picked}
    for _, cand in scored:
        if len(picked) >= _ALTERNATIVES_LIMIT:
            break
        if cand["item_id"] not in already:
            picked.append(cand)
            already.add(cand["item_id"])

    return picked


def _find_healthy_alternatives(
    session: Session,
    user_id: str,
    fav_ids: list[str],
    fav_tags: list[str],
    budget: dict,
) -> list[dict]:

    budget_tight = (
        budget["remaining_calories"] < _LOW_CAL_THRESHOLD
        or budget["remaining_fat_g"] < _LOW_FAT_THRESHOLD
    )
    budget_status = "tight" if budget_tight else "healthy"
    home_canteen = _get_home_canteen(session, user_id)

    if budget_tight:
        scored = _query_healthy_candidates(
            session, fav_ids, fav_tags, budget,
            budget_tight=True, strict=True,
        )
        if not scored:
            scored = _query_healthy_candidates(
                session, fav_ids, fav_tags, budget,
                budget_tight=True, strict=False,
            )
    else:
        scored = _query_healthy_candidates(
            session, fav_ids, fav_tags, budget,
            budget_tight=False,
        )

    picked = _apply_canteen_nudge(scored, home_canteen)

    for rec in picked:
        rec["ui_text"] = generate_recommendation_card(rec, budget_status)

    return picked


# ──────────────────────────────────────────────
#  Main entry point
# ──────────────────────────────────────────────

def get_personalized_recommendations(session: Session, user_id: str) -> dict:
    """
    Returns the dual-track recommendation payload.
    All DB queries happen through the passed-in session.
    """
    user = session.get(User, user_id)
    if not user:
        raise ValueError(f"user {user_id} not found")

    today = date.today()
    budget = get_remaining_daily_budget(session, user_id, today)

    favorites = _get_frequent_favorites(session, user_id)
    fav_ids = [f["item_id"] for f in favorites]
    fav_tags = _get_dominant_tags(session, fav_ids)

    alternatives = _find_healthy_alternatives(
        session, user_id, fav_ids, fav_tags, budget,
    )

    return {
        "user_id": user_id,
        "remaining_calories_today": budget["remaining_calories"],
        "frequent_favorites": [
            {
                "item_id": f["item_id"],
                "dish_name": f["dish_name"],
                "canteen_name": f["canteen_name"],
            }
            for f in favorites
        ],
        "healthy_alternatives": alternatives,
    }
