from pydantic import BaseModel, EmailStr, model_validator
from typing import List, Optional, Any
from datetime import datetime


# User Schemas
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    age: Optional[int] = None
    gender: Optional[str] = None


class UserLogin(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    profile_picture_url: Optional[str] = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    age: Optional[int] = None
    gender: Optional[str] = None
    profile_picture_url: Optional[str] = None
    created_at: Optional[datetime] = None
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_joined: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def populate_defaults(cls, data: Any) -> Any:
        if isinstance(data, dict):
            email = data.get("email", "")
            full_name = data.get("full_name", "")
            created = data.get("created_at")
            if not data.get("username") and email:
                data["username"] = email.split("@")[0]
            if not data.get("first_name") and full_name:
                parts = full_name.split()
                data["first_name"] = parts[0]
                data["last_name"] = " ".join(parts[1:]) if len(parts) > 1 else ""
            if not data.get("date_joined") and created:
                data["date_joined"] = str(created)
            return data
        else:
            # SQLAlchemy object
            email = getattr(data, "email", "")
            full_name = getattr(data, "full_name", "")
            created = getattr(data, "created_at", None)
            parts = full_name.split() if full_name else []
            first_name = parts[0] if parts else ""
            last_name = " ".join(parts[1:]) if len(parts) > 1 else ""
            return {
                "id": data.id,
                "full_name": full_name,
                "email": email,
                "age": getattr(data, "age", None),
                "gender": getattr(data, "gender", None),
                "profile_picture_url": getattr(data, "profile_picture_url", None),
                "created_at": created,
                "username": email.split("@")[0] if email else "",
                "first_name": first_name,
                "last_name": last_name,
                "date_joined": str(created) if created else "",
            }

    class Config:
        from_attributes = True


def parse_time_slot(time_slot: str):
    try:
        parts = str(time_slot).split("-")
        if len(parts) == 2:
            s_str = parts[0].strip()
            e_str = parts[1].strip()

            def to_24h(t_str):
                t_str = t_str.strip()
                for fmt in ("%I:%M %p", "%I:%M%p", "%H:%M:%S", "%H:%M"):
                    try:
                        dt = datetime.strptime(t_str, fmt)
                        return dt.strftime("%H:%M:%S")
                    except ValueError:
                        pass
                return "10:00:00"

            start = to_24h(s_str)
            end = to_24h(e_str)
            h1, m1, _ = map(int, start.split(":"))
            h2, m2, _ = map(int, end.split(":"))
            dur = (h2 * 60 + m2) - (h1 * 60 + m1)
            return start, end, dur if dur > 0 else 60
    except Exception:
        pass
    return "10:00:00", "11:00:00", 60


class Token(BaseModel):
    access_token: str
    access: Optional[str] = None
    refresh_token: Optional[str] = None
    refresh: Optional[str] = None
    token_type: str = "bearer"
    user: UserOut

    @model_validator(mode="before")
    @classmethod
    def populate_tokens(cls, data: Any) -> Any:
        if isinstance(data, dict):
            token = data.get("access_token") or data.get("access")
            if token:
                data["access_token"] = token
                data["access"] = token
                if not data.get("refresh"):
                    data["refresh"] = token
                if not data.get("refresh_token"):
                    data["refresh_token"] = token
        return data


# Booking Schemas
class BookingCreateItem(BaseModel):
    date: Optional[str] = None
    booking_date: Optional[str] = None
    time_slot: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    plan_type: Optional[str] = "Basic"
    plan_name: Optional[str] = None
    price: Optional[float] = 300.0
    status: Optional[str] = "Booked"
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None


class BookingCreateBatch(BaseModel):
    slots: List[BookingCreateItem]


class BookingOut(BaseModel):
    id: int
    user_id: int
    date: str
    booking_date: Optional[str] = None
    time_slot: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration: Optional[int] = 60
    plan_type: str
    plan_name: Optional[str] = None
    price: float
    status: str
    payment_status: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    created_at: Optional[datetime] = None

    @model_validator(mode="before")
    @classmethod
    def populate_booking_aliases(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            d = {
                "id": data.id,
                "user_id": data.user_id,
                "date": data.date,
                "time_slot": data.time_slot,
                "plan_type": getattr(data, "plan_type", "Basic"),
                "price": getattr(data, "price", 300.0),
                "status": getattr(data, "status", "Booked"),
                "razorpay_order_id": getattr(data, "razorpay_order_id", None),
                "razorpay_payment_id": getattr(data, "razorpay_payment_id", None),
                "created_at": getattr(data, "created_at", None),
            }
        else:
            d = data.copy()

        d["booking_date"] = d.get("booking_date") or d.get("date")
        d["plan_name"] = d.get("plan_name") or d.get("plan_type") or "Basic"
        st, et, dur = parse_time_slot(d.get("time_slot", ""))
        d["start_time"] = d.get("start_time") or st
        d["end_time"] = d.get("end_time") or et
        d["duration"] = d.get("duration") or dur
        status = d.get("status", "Booked")
        d["payment_status"] = d.get("payment_status") or (
            "Paid" if status == "Booked" else ("Pending" if status == "Payment Pending" else status)
        )
        return d

    class Config:
        from_attributes = True


class RescheduleRequest(BaseModel):
    new_date: Optional[str] = None
    booking_date: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    force_holiday_shift: bool = False


class OccupiedSlotOut(BaseModel):
    date: str
    time_slot: str
    user_id: int


# Holiday Schemas
class HolidayCreate(BaseModel):
    name: str
    date: str
    is_official: bool = True


class HolidayOut(BaseModel):
    id: int
    name: str
    date: str
    is_official: bool

    class Config:
        from_attributes = True


# Plan Schemas
class PlanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration: int = 60
    monthly_slots: int = 8
    weekly_slots: int = 2
    session_price: float = 300.0
    monthly_price: float = 2200.0


class PlanOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    duration: int
    monthly_slots: int
    weekly_slots: int
    session_price: float
    monthly_price: float
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Pass Schemas
class PassOrderCreate(BaseModel):
    plan_id: int


class PassVerifyPayment(BaseModel):
    plan_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class UserPassOut(BaseModel):
    id: int
    user_id: int
    plan_id: int
    expiry_date: str
    remaining_slots: int
    is_active: bool
    plan: Optional[PlanOut] = None

    class Config:
        from_attributes = True


# Razorpay & Payment Schemas
class RazorpayOrderCreate(BaseModel):
    amount: float
    currency: str = "INR"


class RazorpayVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    booking_id: Optional[int] = None


class ConfirmPassBooking(BaseModel):
    booking_id: int


# Dashboard & Calendar
class DashboardStats(BaseModel):
    total_slots: int
    active_slots: int
    holiday_shifted: int
    payment_pending: int
    cancelled: int
    user: UserOut


class CalendarDataOut(BaseModel):
    holidays: List[HolidayOut]
    bookings: List[BookingOut]
