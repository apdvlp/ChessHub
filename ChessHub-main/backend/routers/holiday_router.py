from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/api/holidays", tags=["Holidays"])


@router.get("", response_model=List[schemas.HolidayOut])
@router.get("/", response_model=List[schemas.HolidayOut])
def get_holidays(db: Session = Depends(get_db)):
    return db.query(models.Holiday).order_by(models.Holiday.date.asc()).all()


@router.post("", response_model=schemas.HolidayOut)
@router.post("/", response_model=schemas.HolidayOut)
def create_holiday(
    holiday_in: schemas.HolidayCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing = db.query(models.Holiday).filter(models.Holiday.date == holiday_in.date).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Holiday for date {holiday_in.date} already exists."
        )
    h = models.Holiday(
        name=holiday_in.name,
        date=holiday_in.date,
        is_official=holiday_in.is_official
    )
    db.add(h)
    db.commit()
    db.refresh(h)
    return h
