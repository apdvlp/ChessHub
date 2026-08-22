from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user_bookings = db.query(models.Booking).filter(
        models.Booking.user_id == current_user.id
    ).all()

    total_slots = len(user_bookings)
    active_slots = len([b for b in user_bookings if b.status == "Booked"])
    holiday_shifted = len([b for b in user_bookings if b.status == "Holiday Shifted"])
    payment_pending = len([b for b in user_bookings if b.status == "Payment Pending"])
    cancelled = len([b for b in user_bookings if b.status == "Cancelled"])

    return {
        "total_slots": total_slots,
        "active_slots": active_slots,
        "holiday_shifted": holiday_shifted,
        "payment_pending": payment_pending,
        "cancelled": cancelled,
        "user": current_user
    }

