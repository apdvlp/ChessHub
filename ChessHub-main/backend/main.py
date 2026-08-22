import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from database import engine, Base, SessionLocal
import models
from routers import auth_router, booking_router, holiday_router, dashboard_router

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ChessHub API", version="2.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists and mount static files
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(os.path.join(uploads_dir, "avatars"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Include Routers
app.include_router(auth_router.router)
app.include_router(booking_router.router)
app.include_router(holiday_router.router)
app.include_router(dashboard_router.router)

# Initial Holiday Seeding for 2026
OFFICIAL_HOLIDAYS_2026 = [
    {"date": "2026-01-26", "name": "Republic Day"},
    {"date": "2026-03-04", "name": "Holi"},
    {"date": "2026-03-20", "name": "Ugadi / Gudi Padwa"},
    {"date": "2026-03-27", "name": "Rama Navami"},
    {"date": "2026-04-03", "name": "Good Friday"},
    {"date": "2026-04-14", "name": "Ambedkar Jayanti"},
    {"date": "2026-05-01", "name": "May Day / Labour Day"},
    {"date": "2026-08-15", "name": "Independence Day"},
    {"date": "2026-08-27", "name": "Milad-un-Nabi"},
    {"date": "2026-10-02", "name": "Gandhi Jayanti"},
    {"date": "2026-10-20", "name": "Dussehra"},
    {"date": "2026-11-08", "name": "Diwali"},
    {"date": "2026-12-25", "name": "Christmas"},
]

@app.on_event("startup")
def seed_holidays():
    db: Session = SessionLocal()
    try:
        if db.query(models.Holiday).count() == 0:
            for h in OFFICIAL_HOLIDAYS_2026:
                db.add(models.Holiday(date=h["date"], name=h["name"], is_official=True))
            db.commit()
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "ChessHub FastAPI Server Running"}
