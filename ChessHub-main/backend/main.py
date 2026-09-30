import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from database import engine, Base, SessionLocal, sync_db_columns
import models
from routers import auth_router, users_router, booking_router, holiday_router, dashboard_router

# Create DB tables and ensure any new columns exist
Base.metadata.create_all(bind=engine)
sync_db_columns()

# Official holidays for 2026
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

DEFAULT_PLANS = [
    {
        "name": "Basic Plan",
        "description": "Perfect for casual players looking for weekend and weekly tournament practice.",
        "duration": 60,
        "monthly_slots": 4,
        "weekly_slots": 1,
        "session_price": 300.0,
        "monthly_price": 1100.0,
    },
    {
        "name": "Monthly Premium",
        "description": "Ideal for serious players aiming for consistent competitive practice and tournament ranking.",
        "duration": 60,
        "monthly_slots": 8,
        "weekly_slots": 2,
        "session_price": 300.0,
        "monthly_price": 2200.0,
    },
    {
        "name": "Master Pass",
        "description": "Intensive high-frequency training pass for aspiring tournament champions and grandmasters.",
        "duration": 60,
        "monthly_slots": 16,
        "weekly_slots": 4,
        "session_price": 250.0,
        "monthly_price": 3600.0,
    },
]


def seed_database():
    db: Session = SessionLocal()
    try:
        # Seed Holidays
        if db.query(models.Holiday).count() == 0:
            for h in OFFICIAL_HOLIDAYS_2026:
                name = h.get("name")
                db.add(models.Holiday(date=h["date"], name=name, is_official=True))
            db.commit()

        # Seed Plans
        if db.query(models.Plan).count() == 0:
            for p in DEFAULT_PLANS:
                db.add(models.Plan(**p))
            db.commit()

        # Seed test user 'ankit' if missing
        ankit_user = db.query(models.User).filter(
            (models.User.email == "ankit@chesshub.com") | (models.User.full_name == "ankit")
        ).first()
        if not ankit_user:
            from auth import get_password_hash
            db.add(models.User(
                full_name="ankit",
                email="ankit@chesshub.com",
                hashed_password=get_password_hash("TestPass123!"),
                age=24,
                gender="Male"
            ))
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_database()
    yield


app = FastAPI(
    title="ChessHub API",
    description="High-performance FastAPI Backend for ChessHub Tournament Platform",
    version="2.0",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for avatars and uploads
uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(os.path.join(uploads_dir, "avatars"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Include Routers
app.include_router(auth_router.router)
app.include_router(users_router.router)
app.include_router(booking_router.router)
app.include_router(holiday_router.router)
app.include_router(dashboard_router.router)


@app.get("/api/health")
@app.get("/api/health/")
def health_check():
    return {"status": "healthy", "service": "ChessHub FastAPI Backend"}


# Frontend Static and SPA Fallback Serving
frontend_dist = os.path.abspath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist")
)
assets_dir = os.path.join(frontend_dist, "assets")

if os.path.isdir(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")


@app.get("/{full_path:path}")
async def serve_frontend_or_root(full_path: str):
    # If API endpoint wasn't found, let FastAPI handle 404
    if full_path.startswith("api/") or full_path == "api":
        return JSONResponse(status_code=404, content={"detail": "API route not found"})

    index_html = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_html):
        target_file = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(index_html)

    return {"message": "ChessHub FastAPI Server Running", "docs": "/docs"}
