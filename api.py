import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from dotenv import load_dotenv
from datetime import datetime

# Load env variables so DATABASE_URL is available before connection
load_dotenv()

from db.connection import SessionLocal
from db.models import create_all_tables, OrderRecord, MenuItem
from modules.recommender import get_personalized_recommendations
from modules.enrichment import enrich_new_menu_item

app = FastAPI(
    title="Canteen AI Engine",
    description="Backend API for canteen recommendations",
    version="1.0.0"
)

# Open CORS so your React/Vue frontend can hit this from any port during demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def on_startup():
    # Make sure all tables exist in Postgres
    create_all_tables()

@app.get("/")
def ping():
    return {"status": "online", "message": "Canteen API is running!"}

@app.get("/recommendations/{user_id}")
def fetch_recommendations(user_id: str, db: Session = Depends(get_db)):
    try:
        # Call the exact same logic we used in main.py
        payload = get_personalized_recommendations(db, user_id)
        return payload
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class EnrichRequest(BaseModel):
    dish_name: str
    canteen_name: str

@app.post("/enrich")
def enrich_item(req: EnrichRequest, db: Session = Depends(get_db)):
    try:
        res = enrich_new_menu_item(db, req.dish_name, req.canteen_name)
        db.commit()
        return res
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class EatRequest(BaseModel):
    user_id: str
    dish_name: str
    canteen_name: str

@app.post("/eat")
def eat_item(req: EatRequest, db: Session = Depends(get_db)):
    try:
        # 1. Cek apakah menu udah ada di database
        item = db.query(MenuItem).filter(
            func.lower(MenuItem.dish_name) == req.dish_name.lower(),
            MenuItem.canteen_name == req.canteen_name
        ).first()
        
        if item:
            item_id = item.item_id
        else:
            # 2. Kalo belum ada, suruh AI nebak dan masukin ke DB
            enriched = enrich_new_menu_item(db, req.dish_name, req.canteen_name)
            item_id = enriched["item_id"]
            
        # 3. Catet kalau user barusan makan ini
        new_order = OrderRecord(
            user_id=req.user_id,
            item_id=item_id,
            timestamp=datetime.now()
        )
        db.add(new_order)
        db.commit()
        
        # 4. Langsung kalkulasi ulang rekomendasi buat si user
        recs = get_personalized_recommendations(db, req.user_id)
        
        item_details = db.query(MenuItem).filter(MenuItem.item_id == item_id).first()
        
        # Generate custom AI balance message
        advice = ""
        if item_details.health_score <= 2:
            advice = f"Karena {item_details.dish_name} cukup berat ({item_details.estimated_calories} kkal), "
        else:
            advice = f"Pilihan bagus! {item_details.dish_name} cukup aman. "
            
        rem = recs['remaining_calories_today']
        if rem < 0:
            advice += f"Waduh, kamu udah tekor/kelebihan {abs(rem)} kkal dari batas kalori harianmu. "
        else:
            advice += f"Sisa jatah kalori kamu sekarang {rem} kkal. "
        
        if recs["healthy_alternatives"]:
            alt_names = [r["dish_name"] for r in recs["healthy_alternatives"][:2]]
            advice += f"Buat nolongin sistem cerna kamu hari ini, rekomendasi cerdas di Kantin SCU buat kamu: {', '.join(alt_names)}."
        else:
            advice += "Jatah kalori kamu beneran udah jebol, mending puasa jajan dulu atau minum air putih aja deh."
            
        return {
            "logged_item": {
                "dish_name": item_details.dish_name,
                "estimated_calories": item_details.estimated_calories,
                "health_score": item_details.health_score,
                "tags": item_details.tags or [],
                "balance_message": advice
            },
            "recommendations": recs
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reset/{user_id}")
def reset_user(user_id: str, db: Session = Depends(get_db)):
    try:
        # Hapus semua histori makan user
        db.query(OrderRecord).filter(OrderRecord.user_id == user_id).delete()
        db.commit()
        
        # Kalkulasi ulang dari nol
        return get_personalized_recommendations(db, user_id)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/canteens")
def get_canteens(db: Session = Depends(get_db)):
    try:
        canteens = db.query(MenuItem.canteen_name).distinct().all()
        return {"canteens": [c[0] for c in canteens if c[0]]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run locally using: uvicorn api:app --reload
