from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])

@router.get("/occupied-slots", response_model=List[schemas.OccupiedSlotOut])
def get_occupied_slots(db: Session = Depends(get_db)):
    occupied = db.query(models.Booking).filter(
        models.Booking.status != "Cancelled"
    ).all()
    return [
        schemas.OccupiedSlotOut(date=b.date, time_slot=b.time_slot, user_id=b.user_id)
        for b in occupied
    ]

@router.post("", response_model=List[schemas.BookingOut])
@router.post("/", response_model=List[schemas.BookingOut])
def create_bookings(
    batch: schemas.BookingCreateBatch,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Prevent duplicate bookings for the same date and same time slot
    for slot in batch.slots:
        normalized_time_slot = slot.time_slot.strip()
        existing = db.query(models.Booking).filter(
            models.Booking.date == slot.date,
            models.Booking.time_slot == normalized_time_slot,
            models.Booking.status != "Cancelled"
        ).first()

        if existing:
            # If the existing booking belongs to the current user and is Payment Pending, allow updating it
            if existing.user_id == current_user.id and existing.status == "Payment Pending":
                continue
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"The slot '{normalized_time_slot}' on {slot.date} is already registered by another user. You can choose a different time slot on the same date or pick a different date."
            )

    created_bookings = []
    for slot in batch.slots:
        normalized_time_slot = slot.time_slot.strip()
        holiday = db.query(models.Holiday).filter(models.Holiday.date == slot.date).first()
        desired_status = getattr(slot, "status", None) or "Booked"

        if holiday:
            slot_status = "Holiday Shifted"
        else:
            slot_status = desired_status

        # Check if existing pending booking by user exists
        existing = db.query(models.Booking).filter(
            models.Booking.user_id == current_user.id,
            models.Booking.date == slot.date,
            models.Booking.time_slot == normalized_time_slot,
            models.Booking.status == "Payment Pending"
        ).first()

        if existing:
            existing.status = slot_status
            existing.plan_type = slot.plan_type
            existing.price = slot.price
            created_bookings.append(existing)
        else:
            booking = models.Booking(
                user_id=current_user.id,
                date=slot.date,
                time_slot=normalized_time_slot,
                plan_type=slot.plan_type,
                price=slot.price,
                status=slot_status
            )
            db.add(booking)
            created_bookings.append(booking)

    db.commit()
    for b in created_bookings:
        db.refresh(b)

    return created_bookings

@router.put("/{booking_id}/confirm-payment", response_model=schemas.BookingOut)
def confirm_booking_payment(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.user_id == current_user.id
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    holiday = db.query(models.Holiday).filter(models.Holiday.date == booking.date).first()
    booking.status = "Holiday Shifted" if holiday else "Booked"
    db.commit()
    db.refresh(booking)
    return booking


@router.get("", response_model=List[schemas.BookingOut])
@router.get("/", response_model=List[schemas.BookingOut])
def get_user_bookings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Booking).filter(
        models.Booking.user_id == current_user.id
    ).order_by(models.Booking.date.asc()).all()

@router.put("/{booking_id}/reschedule")
def reschedule_booking(
    booking_id: int,
    req: schemas.RescheduleRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.user_id == current_user.id
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Check if target date + current time_slot is already occupied
    existing = db.query(models.Booking).filter(
        models.Booking.id != booking_id,
        models.Booking.date == req.new_date,
        models.Booking.time_slot == booking.time_slot,
        models.Booking.status != "Cancelled"
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The slot '{booking.time_slot}' on {req.new_date} is already registered by another user. Please pick a different date."
        )

    holiday = db.query(models.Holiday).filter(models.Holiday.date == req.new_date).first()

    if holiday and not req.force_holiday_shift:
        return {
            "requires_holiday_confirmation": True,
            "holiday_name": holiday.name,
            "message": f"Selected date is a holiday: {holiday.name}. Slot will be shifted automatically."
        }

    booking.date = req.new_date
    booking.status = "Holiday Shifted" if holiday else "Booked"
    db.commit()
    db.refresh(booking)

    return {
        "requires_holiday_confirmation": False,
        "booking": schemas.BookingOut.from_orm(booking)
    }

@router.delete("/{booking_id}/cancel", response_model=schemas.BookingOut)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.user_id == current_user.id
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = "Cancelled"
    db.commit()
    db.refresh(booking)
    return booking

@router.post("/create-order")
def create_razorpay_order(
    req: schemas.RazorpayOrderCreate,
    current_user: models.User = Depends(get_current_user)
):
    from payment import client
    try:
        amount_in_paise = int(req.amount * 100)
        order = client.order.create({
            "amount": amount_in_paise,
            "currency": req.currency,
            "payment_capture": 1
        })
        return order
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to create Razorpay order: {str(e)}"
        )

@router.post("/verify-payment")
def verify_razorpay_payment(
    req: schemas.RazorpayVerify,
    current_user: models.User = Depends(get_current_user)
):
    from payment import client
    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": req.razorpay_order_id,
            "razorpay_payment_id": req.razorpay_payment_id,
            "razorpay_signature": req.razorpay_signature
        })
        return {"status": "success", "message": "Razorpay payment verified successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Razorpay payment verification failed: {str(e)}"
        )

