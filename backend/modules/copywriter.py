"""
Module 4 — UI/UX Copywriting Helper

Generates student-friendly, non-shaming recommendation cards.
Tone: encouraging, casual, never guilt-trippy.
"""

from __future__ import annotations


def generate_recommendation_card(
    recommended_item: dict,
    budget_status: str,
) -> dict:
    """
    Produces a title + body dict for the mobile notification card.

    budget_status is either "healthy" (plenty of room left) or
    "tight" (they already ate heavy today).
    """

    dish = recommended_item["dish_name"]
    canteen = recommended_item["canteen_name"]
    tags = set(recommended_item.get("tags", []))

    # figure out a friendly protein keyword from the tags
    proteins = tags & {"Chicken", "Beef", "Fish", "Tofu", "Egg"}
    protein_label = next(iter(proteins), None)

    if budget_status == "tight":
        title = "Balancing your day"
        body = (
            f"Since lunch was a bit heavy, check out the {dish} "
            f"from {canteen} for a light, refreshing pick."
        )

    elif protein_label:
        title = f"Love {protein_label}?"
        cals = recommended_item.get("estimated_calories", "")
        body = (
            f"Try the {dish} at {canteen} today — "
            f"same great protein, only {cals} cal!"
        )

    else:
        title = "Something new for you"
        body = (
            f"The {dish} at {canteen} is getting great reviews. "
            f"Give it a shot!"
        )

    return {"title": title, "body": body}
