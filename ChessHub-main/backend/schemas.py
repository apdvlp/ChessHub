from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    age: Optional[int] = None
    gender: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    age: Optional[int] = None
    gender: Optional[str] = None
    profile_picture_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class BookingCreateItem(BaseModel):
    date: str  # YYYY-MM-DD
    time_slot: str  # e.g., "10:00 AM" or "10:00 AM - 11:00 AM"
    plan_type: str
    price: float
    status: Optional[str] = "Booked"

class BookingCreateBatch(BaseModel):
    slots: List[BookingCreateItem]

class BookingOut(BaseModel):
    id: int
    user_id: int
    date: str
    time_slot: str
    plan_type: str
    price: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class RescheduleRequest(BaseModel):
    new_date: str  # YYYY-MM-DD
    force_holiday_shift: bool = False

class HolidayOut(BaseModel):
    id: int
    name: str
    date: str
    is_official: bool

    class Config:
        from_attributes = True

class OccupiedSlotOut(BaseModel):
    date: str
    time_slot: str
    user_id: int

class DashboardStats(BaseModel):
    total_slots: int
    active_slots: int
    holiday_shifted: int
    payment_pending: int
    cancelled: int
    user: UserOut


class RazorpayOrderCreate(BaseModel):
    amount: float
    currency: str = "INR"

class RazorpayVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

