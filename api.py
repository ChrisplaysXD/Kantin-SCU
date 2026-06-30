import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from dotenv import load_dotenv

# Load env variables so DATABASE_URL is available before connection
load_dotenv()

from db.connection import SessionLocal
from db.models import create_all_tables
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

# Run locally using: uvicorn api:app --reload
