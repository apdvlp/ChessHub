from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/holidays", tags=["Holidays"])

@router.get("", response_model=List[schemas.HolidayOut])
@router.get("/", response_model=List[schemas.HolidayOut])
def get_holidays(db: Session = Depends(get_db)):
    holidays = db.query(models.Holiday).order_by(models.Holiday.date.asc()).all()
    return holidays
