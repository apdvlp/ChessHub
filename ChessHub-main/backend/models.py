import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    profile_picture_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    passes = relationship("UserPass", back_populates="user", cascade="all, delete-orphan")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False)  # YYYY-MM-DD
    time_slot = Column(String, nullable=False)  # e.g., "10:00 AM - 11:00 AM"
    plan_type = Column(String, nullable=False, default="Basic")  # "Basic", "Monthly Premium", "Custom"
    price = Column(Float, nullable=False, default=300.0)
    status = Column(String, nullable=False, default="Booked")  # "Booked", "Payment Pending", "Cancelled", "Holiday Shifted"
    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="bookings")


class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    date = Column(String, unique=True, index=True, nullable=False)  # YYYY-MM-DD
    is_official = Column(Boolean, default=True)


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    duration = Column(Integer, default=60)
    monthly_slots = Column(Integer, default=8)
    weekly_slots = Column(Integer, default=2)
    session_price = Column(Float, default=300.0)
    monthly_price = Column(Float, default=2200.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    passes = relationship("UserPass", back_populates="plan")


class UserPass(Base):
    __tablename__ = "user_passes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
    expiry_date = Column(String, nullable=False)  # YYYY-MM-DD
    remaining_slots = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="passes")
    plan = relationship("Plan", back_populates="passes")
