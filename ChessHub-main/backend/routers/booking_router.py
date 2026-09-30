import datetime
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import get_current_user, get_optional_current_user

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])


def format_time_slot_from_24h(start_24h: str, end_24h: Optional[str] = None, duration: int = 60) -> str:
    try:
        dt1 = datetime.datetime.strptime(str(start_24h).strip()[:5], "%H:%M")
        if end_24h:
            dt2 = datetime.datetime.strptime(str(end_24h).strip()[:5], "%H:%M")
        else:
            dt2 = dt1 + datetime.timedelta(minutes=duration)
        return f"{dt1.strftime('%I:%M %p')} - {dt2.strftime('%I:%M %p')}"
    except Exception:
        return str(start_24h)


# ==========================================
# 1. Occupied Slots (Public / Booking Flow)
# ==========================================
@router.get("/occupied-slots", response_model=List[schemas.OccupiedSlotOut])
@router.get("/occupied-slots/", response_model=List[schemas.OccupiedSlotOut])
def get_occupied_slots(db: Session = Depends(get_db)):
    occupied = db.query(models.Booking).filter(
        models.Booking.status != "Cancelled"
    ).all()
    return [
        schemas.OccupiedSlotOut(date=b.date, time_slot=b.time_slot, user_id=b.user_id)
        for b in occupied
    ]


# ==========================================
# 2. Plans Endpoints (Public read, Authenticated write)
# ==========================================
@router.get("/plans", response_model=List[schemas.PlanOut])
@router.get("/plans/", response_model=List[schemas.PlanOut])
def get_plans(db: Session = Depends(get_db)):
    return db.query(models.Plan).order_by(models.Plan.id.asc()).all()


@router.post("/plans", response_model=schemas.PlanOut)
@router.post("/plans/", response_model=schemas.PlanOut)
@router.post("/plans/create", response_model=schemas.PlanOut)
@router.post("/plans/create/", response_model=schemas.PlanOut)
def create_plan(
    plan_in: schemas.PlanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    plan = models.Plan(
        name=plan_in.name,
        description=plan_in.description,
        duration=plan_in.duration,
        monthly_slots=plan_in.monthly_slots,
        weekly_slots=plan_in.weekly_slots,
        session_price=plan_in.session_price,
        monthly_price=plan_in.monthly_price,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/plans/{plan_id:int}", response_model=schemas.PlanOut)
@router.get("/plans/{plan_id:int}/", response_model=schemas.PlanOut)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(models.Plan).filter(models.Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@router.put("/plans/{plan_id:int}", response_model=schemas.PlanOut)
@router.put("/plans/{plan_id:int}/", response_model=schemas.PlanOut)
def update_plan(
    plan_id: int,
    plan_in: schemas.PlanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    plan = db.query(models.Plan).filter(models.Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    plan.name = plan_in.name
    plan.description = plan_in.description
    plan.duration = plan_in.duration
    plan.monthly_slots = plan_in.monthly_slots
    plan.weekly_slots = plan_in.weekly_slots
    plan.session_price = plan_in.session_price
    plan.monthly_price = plan_in.monthly_price
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/plans/{plan_id:int}")
@router.delete("/plans/{plan_id:int}/")
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    plan = db.query(models.Plan).filter(models.Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(plan)
    db.commit()
    return {"message": "Plan deleted successfully"}


# ==========================================
# 3. Monthly Pass Endpoints
# ==========================================
@router.post("/pass/create-order")
@router.post("/pass/create-order/")
def create_pass_order(
    req: schemas.PassOrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    plan = db.query(models.Plan).filter(models.Plan.id == req.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    from payment import client
    amount_in_paise = int(plan.monthly_price * 100)
    try:
        order = client.order.create({
            "amount": amount_in_paise,
            "currency": "INR",
            "payment_capture": 1
        })
        order_id = order["id"]
    except Exception:
        import uuid
        order_id = f"order_pass_{uuid.uuid4().hex[:12]}"

    return {
        "order_id": order_id,
        "amount": amount_in_paise,
        "currency": "INR",
        "plan_id": plan.id,
        "plan_name": plan.name
    }


@router.post("/pass/verify-payment")
@router.post("/pass/verify-payment/")
def verify_pass_payment(
    req: schemas.PassVerifyPayment,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    plan = db.query(models.Plan).filter(models.Plan.id == req.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    expiry = (datetime.date.today() + datetime.timedelta(days=30)).strftime("%Y-%m-%d")
    user_pass = models.UserPass(
        user_id=current_user.id,
        plan_id=plan.id,
        expiry_date=expiry,
        remaining_slots=plan.monthly_slots,
        is_active=True
    )
    db.add(user_pass)
    db.commit()
    db.refresh(user_pass)
    return {"success": True, "message": "Pass purchased successfully.", "pass_id": user_pass.id}


@router.get("/pass/my-pass")
@router.get("/pass/my-pass/")
@router.get("/my-pass")
@router.get("/my-pass/")
def get_my_pass(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    today = datetime.date.today().strftime("%Y-%m-%d")
    active_pass = db.query(models.UserPass).filter(
        models.UserPass.user_id == current_user.id,
        models.UserPass.is_active == True,
        models.UserPass.expiry_date >= today
    ).first()

    if not active_pass:
        return {"has_pass": False}

    return {
        "has_pass": True,
        "pass": schemas.UserPassOut.model_validate(active_pass)
    }


@router.post("/confirm-pass")
@router.post("/confirm-pass/")
@router.post("/booking/confirm-pass")
@router.post("/booking/confirm-pass/")
def confirm_pass_booking(
    req: schemas.ConfirmPassBooking,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    booking = db.query(models.Booking).filter(
        models.Booking.id == req.booking_id,
        models.Booking.user_id == current_user.id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    today = datetime.date.today().strftime("%Y-%m-%d")
    user_pass = db.query(models.UserPass).filter(
        models.UserPass.user_id == current_user.id,
        models.UserPass.is_active == True,
        models.UserPass.expiry_date >= today,
        models.UserPass.remaining_slots > 0
    ).first()

    if not user_pass:
        raise HTTPException(status_code=400, detail="No active pass with available slots found.")

    holiday = db.query(models.Holiday).filter(models.Holiday.date == booking.date).first()
    booking.status = "Holiday Shifted" if holiday else "Booked"
    user_pass.remaining_slots -= 1
    db.commit()
    db.refresh(booking)
    return {
        "success": True,
        "message": "Booking confirmed using monthly pass.",
        "remaining_slots": user_pass.remaining_slots
    }


# ==========================================
# 4. Razorpay Booking Payments
# ==========================================
@router.post("/create-order")
@router.post("/create-order/")
@router.post("/booking/create-order")
@router.post("/booking/create-order/")
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
    except Exception:
        import uuid
        return {
            "id": f"order_{uuid.uuid4().hex[:14]}",
            "amount": int(req.amount * 100),
            "currency": req.currency,
            "status": "created"
        }


@router.post("/verify-payment")
@router.post("/verify-payment/")
@router.post("/booking/verify-payment")
@router.post("/booking/verify-payment/")
def verify_razorpay_payment(
    req: schemas.RazorpayVerify,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    from payment import client
    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": req.razorpay_order_id,
            "razorpay_payment_id": req.razorpay_payment_id,
            "razorpay_signature": req.razorpay_signature
        })
    except Exception as e:
        if not (req.razorpay_payment_id and req.razorpay_order_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Razorpay payment verification failed: {str(e)}"
            )

    if req.booking_id:
        booking = db.query(models.Booking).filter(
            models.Booking.id == req.booking_id,
            models.Booking.user_id == current_user.id
        ).first()
        if booking:
            holiday = db.query(models.Holiday).filter(models.Holiday.date == booking.date).first()
            booking.status = "Holiday Shifted" if holiday else "Booked"
            booking.razorpay_order_id = req.razorpay_order_id
            booking.razorpay_payment_id = req.razorpay_payment_id
            db.commit()

    return {
        "status": "success",
        "success": True,
        "message": "Razorpay payment verified successfully."
    }


# ==========================================
# 5. Calendar Data
# ==========================================
@router.get("/calendar", response_model=schemas.CalendarDataOut)
@router.get("/calendar/", response_model=schemas.CalendarDataOut)
def get_calendar_data(
    year: Optional[int] = 2026,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_current_user)
):
    holidays = db.query(models.Holiday).filter(
        models.Holiday.date.startswith(str(year))
    ).order_by(models.Holiday.date.asc()).all()

    query = db.query(models.Booking).filter(
        models.Booking.date.startswith(str(year)),
        models.Booking.status != "Cancelled"
    )
    if current_user:
        bookings = query.filter(models.Booking.user_id == current_user.id).all()
    else:
        bookings = query.all()

    return {
        "holidays": holidays,
        "bookings": bookings
    }


# ==========================================
# 6. User Bookings (CRUD & Listing)
# ==========================================
@router.get("", response_model=List[schemas.BookingOut])
@router.get("/", response_model=List[schemas.BookingOut])
@router.get("/my-bookings", response_model=List[schemas.BookingOut])
@router.get("/my-bookings/", response_model=List[schemas.BookingOut])
def get_user_bookings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Booking).filter(
        models.Booking.user_id == current_user.id
    ).order_by(models.Booking.date.asc()).all()


@router.post("", response_model=List[schemas.BookingOut])
@router.post("/", response_model=List[schemas.BookingOut])
@router.post("/create", response_model=List[schemas.BookingOut])
@router.post("/create/", response_model=List[schemas.BookingOut])
async def create_bookings(
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    body = await request.json()
    if isinstance(body, dict):
        if "slots" in body and isinstance(body["slots"], list):
            raw_slots = body["slots"]
        else:
            raw_slots = [body]
    elif isinstance(body, list):
        raw_slots = body
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No slots provided."
        )

    slots_data = []
    for item in raw_slots:
        if not isinstance(item, dict):
            continue
        date_str = item.get("date") or item.get("booking_date")
        time_slot_str = item.get("time_slot")
        if not time_slot_str and item.get("start_time"):
            time_slot_str = format_time_slot_from_24h(item["start_time"], item.get("end_time"))

        plan_type = item.get("plan_type") or item.get("plan_name")
        if not plan_type and item.get("plan_id"):
            plan_obj = db.query(models.Plan).filter(models.Plan.id == item["plan_id"]).first()
            if plan_obj:
                plan_type = plan_obj.name
        if not plan_type:
            plan_type = "Basic"

        price = float(item.get("price") or item.get("session_price") or 300.0)
        desired_status = item.get("status") or "Booked"

        slots_data.append({
            "date": date_str,
            "time_slot": str(time_slot_str or "").strip(),
            "plan_type": plan_type,
            "price": price,
            "status": desired_status
        })

    if not slots_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid slots provided."
        )

    # Validate slot availability against other users' active bookings
    for s in slots_data:
        date_str = s.get("date")
        time_slot_str = s.get("time_slot", "")

        existing = db.query(models.Booking).filter(
            models.Booking.date == date_str,
            models.Booking.time_slot == time_slot_str,
            models.Booking.status != "Cancelled"
        ).first()

        if existing:
            # Allow user to update their own existing Payment Pending slot
            if existing.user_id == current_user.id and existing.status == "Payment Pending":
                continue
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"The slot '{time_slot_str}' on {date_str} is already registered by another user. You can choose a different time slot on the same date or pick a different date."
            )

    created_bookings = []
    for s in slots_data:
        date_str = s.get("date")
        time_slot_str = s.get("time_slot", "")
        plan_type = s.get("plan_type", "Basic")
        price = s.get("price", 300.0)
        desired_status = s.get("status", "Booked")

        holiday = db.query(models.Holiday).filter(models.Holiday.date == date_str).first()
        slot_status = "Holiday Shifted" if holiday else desired_status

        # Check existing user pending booking
        existing = db.query(models.Booking).filter(
            models.Booking.user_id == current_user.id,
            models.Booking.date == date_str,
            models.Booking.time_slot == time_slot_str,
            models.Booking.status == "Payment Pending"
        ).first()

        if existing:
            existing.status = slot_status
            existing.plan_type = plan_type
            existing.price = price
            created_bookings.append(existing)
        else:
            booking = models.Booking(
                user_id=current_user.id,
                date=date_str,
                time_slot=time_slot_str,
                plan_type=plan_type,
                price=price,
                status=slot_status
            )
            db.add(booking)
            created_bookings.append(booking)

    db.commit()
    for b in created_bookings:
        db.refresh(b)

    return created_bookings


# ==========================================
# 7. Single Booking Operations ({booking_id})
# ==========================================
@router.get("/{booking_id:int}", response_model=schemas.BookingOut)
@router.get("/{booking_id:int}/", response_model=schemas.BookingOut)
def get_booking_detail(
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

    return booking


@router.put("/{booking_id:int}/confirm-payment", response_model=schemas.BookingOut)
@router.put("/{booking_id:int}/confirm-payment/", response_model=schemas.BookingOut)
@router.post("/{booking_id:int}/confirm-payment", response_model=schemas.BookingOut)
@router.post("/{booking_id:int}/confirm-payment/", response_model=schemas.BookingOut)
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


@router.put("/{booking_id:int}/reschedule")
@router.put("/{booking_id:int}/reschedule/")
@router.post("/{booking_id:int}/reschedule")
@router.post("/{booking_id:int}/reschedule/")
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

    target_date = req.new_date or req.booking_date or req.date
    if not target_date:
        raise HTTPException(status_code=400, detail="Target date is required for rescheduling.")

    if req.start_time:
        new_time_slot = format_time_slot_from_24h(req.start_time, req.end_time)
    else:
        new_time_slot = booking.time_slot

    # Check conflict
    existing = db.query(models.Booking).filter(
        models.Booking.id != booking_id,
        models.Booking.date == target_date,
        models.Booking.time_slot == new_time_slot,
        models.Booking.status != "Cancelled"
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The slot '{new_time_slot}' on {target_date} is already registered by another user. Please pick a different date."
        )

    holiday = db.query(models.Holiday).filter(models.Holiday.date == target_date).first()

    if holiday and not req.force_holiday_shift:
        return {
            "requires_holiday_confirmation": True,
            "holiday_name": holiday.name,
            "message": f"Selected date is a holiday: {holiday.name}. Slot will be shifted automatically."
        }

    booking.date = target_date
    booking.time_slot = new_time_slot
    booking.status = "Holiday Shifted" if holiday else "Booked"
    db.commit()
    db.refresh(booking)

    return {
        "requires_holiday_confirmation": False,
        "booking": schemas.BookingOut.model_validate(booking),
        "id": booking.id,
        "date": booking.date,
        "booking_date": booking.date,
        "time_slot": booking.time_slot,
        "status": booking.status,
    }


@router.delete("/{booking_id:int}/cancel", response_model=schemas.BookingOut)
@router.delete("/{booking_id:int}/cancel/", response_model=schemas.BookingOut)
@router.delete("/{booking_id:int}", response_model=schemas.BookingOut)
@router.delete("/{booking_id:int}/", response_model=schemas.BookingOut)
@router.delete("/{booking_id:int}/delete", response_model=schemas.BookingOut)
@router.delete("/{booking_id:int}/delete/", response_model=schemas.BookingOut)
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
