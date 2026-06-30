"""
Module 1 — AI Menu Enrichment Pipeline (database-backed)

Simulates an LLM call to parse unstructured dish names into
structured macro data. Persists via SQLAlchemy session.
"""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from db.models import MenuItem


SYSTEM_PROMPT = """You are a nutrition analysis engine for a university canteen app.
Given a dish name, return ONLY a valid JSON object — no markdown, no explanation.

Schema:
{
  "dish_name": "<cleaned dish name>",
  "estimated_calories": <int>,
  "protein_g": <int>,
  "fat_g": <int>,
  "carbs_g": <int>,
  "health_score": <int 1-5, where 5 = healthiest>,
  "tags": ["<tag1>", "<tag2>", ...]
}

Rules:
- Estimate macros realistically for a single adult serving.
- health_score guide: 1 = deep-fried / very processed, 5 = fresh salad / steamed.
- tags must include cooking method (Fried, Grilled, Steamed, Raw),
  protein source (Chicken, Beef, Tofu, Fish, Egg), dominant carb (Rice, Noodle, Bread),
  and dietary flags (High-Protein, High-Fat, Low-Cal) where applicable.
- Output raw JSON only."""


def _mock_llm_response(dish_name: str) -> dict:
    """
    Deterministic stand-in for the real LLM.
    Maps keywords in the dish name to rough macro estimates.
    """
    name_lower = dish_name.lower()

    cals, protein, fat, carbs = 500, 20, 15, 60
    score = 3
    tags: list[str] = []

    if "fried" in name_lower or "katsu" in name_lower or "crispy" in name_lower:
        cals += 200
        fat += 18
        score = max(1, score - 2)
        tags.extend(["Fried", "High-Fat"])

    if "grilled" in name_lower or "teriyaki" in name_lower:
        score = min(5, score + 1)
        tags.append("Grilled")

    if "steamed" in name_lower:
        fat -= 5
        score = min(5, score + 2)
        tags.append("Steamed")

    if "salad" in name_lower or "poke" in name_lower:
        cals = 350
        fat = 10
        carbs = 30
        score = 5
        tags.extend(["Raw", "Low-Cal"])

    if "chicken" in name_lower:
        protein += 12
        tags.append("Chicken")
    if "beef" in name_lower or "rendang" in name_lower:
        protein += 15
        fat += 8
        tags.append("Beef")
    if "tofu" in name_lower:
        protein += 8
        fat -= 3
        tags.append("Tofu")
    if "fish" in name_lower or "salmon" in name_lower:
        protein += 14
        tags.extend(["Fish", "High-Protein"])
    if "egg" in name_lower or "salted egg" in name_lower:
        protein += 6
        fat += 5
        tags.append("Egg")

    if "rice" in name_lower or "nasi" in name_lower:
        carbs += 20
        tags.append("Rice")
    if "noodle" in name_lower or "mie" in name_lower:
        carbs += 15
        tags.append("Noodle")

    if protein >= 30:
        tags.append("High-Protein")

    tags = list(dict.fromkeys(tags))

    return {
        "dish_name": dish_name.strip(),
        "estimated_calories": max(cals, 100),
        "protein_g": max(protein, 5),
        "fat_g": max(fat, 3),
        "carbs_g": max(carbs, 10),
        "health_score": max(1, min(5, score)),
        "tags": tags,
    }


def enrich_new_menu_item(session: Session, dish_name: str, canteen_name: str) -> dict:
    """
    Takes a raw dish name from a vendor, runs it through the LLM
    (mocked here), persists a MenuItem row, and returns the result.
    """
    enriched = _mock_llm_response(dish_name)

    item = MenuItem(
        item_id=str(uuid.uuid4()),
        canteen_name=canteen_name,
        dish_name=enriched["dish_name"],
        estimated_calories=enriched["estimated_calories"],
        protein_g=enriched["protein_g"],
        fat_g=enriched["fat_g"],
        carbs_g=enriched["carbs_g"],
        health_score=enriched["health_score"],
        tags=enriched["tags"],
    )
    session.add(item)
    session.flush()

    return {
        "item_id": item.item_id,
        "canteen_name": canteen_name,
        **enriched,
    }
